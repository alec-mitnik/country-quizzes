import type { Cca3Code } from "@yusifaliyevpro/countries/types";
import { useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import useCountries from "../hooks/useCountries";
import type Quiz from "../pages/Quiz";
import type { RankingQuizType } from "../pages/Quiz";
import DraggableCountry from "./DraggableCountry";
import DraggableCountryList from "./DraggableCountryList";
import DraggableCountryPool from "./DraggableCountryPool";
import QuizSubmitButton from "./QuizSubmitButton";

const CUSTOM_DRAG_TYPE = 'application/country-code';

interface QuizControlsForRankingProps {
  quiz: Quiz;
  setQuiz: (quiz: Quiz) => void;
}

function QuizControlsForRanking({quiz, setQuiz}: QuizControlsForRankingProps) {
  const [rankedCountryCodes, setRankedCountryCodes] = useState<Cca3Code[]>([]);
  const [selectedCountryCode, setSelectedCountryCode] = useState<Cca3Code | null>(null);
  const [isDraggingCountryCode, setIsDraggingCountryCode] = useState(false);
  const dragTestTimeoutIdRef = useRef(0);

  // TODO - change how drop works to be more intuitive so that top half of item goes above,
  // bottom half goes below, above top item is first, below last item is last,
  // and to the sides of items is not valid
  const [countryCodeBeingDraggedOver, setCountryCodeBeingDraggedOver] =
      useState<Cca3Code | null>(null);

  // Announcement for screen readers
  const [srAnnouncement, setSrAnnouncement] = useState('');
  const srAnnouncementTimeoutIdRef = useRef(0);

  useEffect(() => {
    return () => {
      clearTimeout(srAnnouncementTimeoutIdRef.current);
      clearTimeout(dragTestTimeoutIdRef.current);
    };
  }, []);

  const { independentOnly, storedCountryData } = useCountries();

  const quizType = quiz.type as RankingQuizType;

  const rankingTypeLabel = quizType.key === "ORDER_BY_POPULATION" ? "Population" : "Size";

  const unrankedCountryCodes = useMemo(() => {
    const unrankedCodes = quiz.countryCodes.filter(
      (countryCode) => !rankedCountryCodes.includes(countryCode));

    // Sort alphabetically by country name
    unrankedCodes.sort((a, b) => {
      return storedCountryData.countries[a]?.data?.name
          .localeCompare(storedCountryData.countries[b]?.data?.name ?? "") ?? 0;
    });

    return unrankedCodes;
  }, [rankedCountryCodes, storedCountryData.countries, quiz.countryCodes]);

  function announceForScreenReaders(message: string) {
    clearTimeout(srAnnouncementTimeoutIdRef.current);
    setSrAnnouncement(message);

    // Clear the message after a delay so that it doesn't remain
    // navigable by screen readers in browse mode
    srAnnouncementTimeoutIdRef.current = setTimeout(() => setSrAnnouncement(''), 1000);
  }

  function handleDragStart(event: DragEvent, countryCode: Cca3Code) {
    if (event.dataTransfer.types.length) {
      // Deselect any selected text
      window.getSelection()?.removeAllRanges();

      // Trying to salvage the current drag doesn't tend to work, so just cancel it
      event.preventDefault();
      return;
    }

    // Use a custom data type to prevent interactions with dragged text or the like
    event.dataTransfer.setData(CUSTOM_DRAG_TYPE, countryCode);
    event.dataTransfer.effectAllowed = 'move';

    setSelectedCountryCode(countryCode);
    setIsDraggingCountryCode(true);

    clearTimeout(dragTestTimeoutIdRef.current);
    dragTestTimeoutIdRef.current = setTimeout(() => {
      console.log('handleDragStart timeout');
      // If timeout wasn't cleared, dragging is probably broken, so cancel it
      // (seems to be an issue on some Android devices)
      handleDragEnd();
    }, 2000);
  }

  function handleDrag() {
    clearTimeout(dragTestTimeoutIdRef.current);
  }

  function handleDragEnd() {
    // Note that this won't get triggered if the dragged element
    // is unmounted in the drop handler, so drop handlers that
    // move elements need to clear the selection themselves
    setSelectedCountryCode(null);
    setIsDraggingCountryCode(false);
    setCountryCodeBeingDraggedOver(null);
  }

  function handleDragOver(event: DragEvent) {
    if (event.dataTransfer.types.every(type => type === CUSTOM_DRAG_TYPE)) {
      event.preventDefault();
    }
  }

  function handleDragEnterForRankedListItem(event: DragEvent, itemCountryCode: Cca3Code) {
    if (selectedCountryCode && selectedCountryCode !== itemCountryCode
        && event.dataTransfer.types.every(type => type === CUSTOM_DRAG_TYPE)) {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
      setCountryCodeBeingDraggedOver(itemCountryCode);
    } else {
      event.dataTransfer.dropEffect = 'none';
    }
  }

  function handleDragLeaveForRankedListItem(event: DragEvent, itemCountryCode: Cca3Code) {
    const isListItem = event.target instanceof HTMLDivElement
        && event.target.matches('.draggable-country');
    if (isListItem && selectedCountryCode && countryCodeBeingDraggedOver === itemCountryCode
        && event.dataTransfer.types.every(type => type === CUSTOM_DRAG_TYPE)) {
      event.preventDefault();

      // This is needed or else it overrides the enter handler for an adjacent list item
      setCountryCodeBeingDraggedOver(prev => prev === itemCountryCode ? null : prev);
    }
  }

  function handleDropForRankedListItem(event: DragEvent, itemCountryCode: Cca3Code) {
    if (selectedCountryCode && event.dataTransfer.types.every(type => type === CUSTOM_DRAG_TYPE)) {
      event.preventDefault();
      event.stopPropagation();

      if (selectedCountryCode !== itemCountryCode) {
        const rankIndex = rankedCountryCodes.indexOf(itemCountryCode);
        onAdd(selectedCountryCode, rankIndex);
        handleDragEnd();
      }
    }
  }

  function handleDropForRankedList(event: DragEvent) {
    if (selectedCountryCode && event.dataTransfer.types.every(type => type === CUSTOM_DRAG_TYPE)) {
      event.preventDefault();
      event.stopPropagation();
      onAdd(selectedCountryCode);
      handleDragEnd();
    }
  }

  function handleDropForUnrankedPool(event: DragEvent) {
    if (rankedCountryCodes.length !== 0 && selectedCountryCode
        && event.dataTransfer.types.every(type => type === CUSTOM_DRAG_TYPE)) {
      event.preventDefault();
      event.stopPropagation();
      onRemove(selectedCountryCode);
      handleDragEnd();
    }
  }

  function attemptSubmit() {
    let submissionCorrect = true;
    let previousValue = Number.MAX_SAFE_INTEGER;

    // Submission is correct if all ranked values go in descending order
    for (const countryCode of rankedCountryCodes) {
      const currentValue = quizType.valueFunction(storedCountryData, countryCode);

      if (currentValue > previousValue) {
        submissionCorrect = false;
        break;
      }

      previousValue = currentValue;
    }

    let newRankedCountryCodes = rankedCountryCodes;

    const submissionsRemaining = quiz.submissionsRemaining - 1;
    let screenReaderMessage = "";

    if (!submissionCorrect) {
      // Submission was incorrect, so clear out any non-locked-in countries
      newRankedCountryCodes = rankedCountryCodes.filter(
          code => quiz.countryCodesLockedInAsCorrect.includes(code));
      setRankedCountryCodes(newRankedCountryCodes);

      // Briefly animate the ranked list shaking
      const rankedListElement = document.querySelector('.draggable-country-list');

      if (rankedListElement) {
        rankedListElement.classList.add('shake');
        setTimeout(() => rankedListElement.classList.remove('shake'), 500);
      }

      // TODO - sound effect

      screenReaderMessage = "Submission incorrect.";
    } else {
      screenReaderMessage = "Submission correct and locked-in.";
    }

    screenReaderMessage += ` ${submissionsRemaining} submission${
          submissionsRemaining === 1 ? "" : "s"} remaining.`;

    const newLockedInCountryCodes = newRankedCountryCodes;

    if (quiz.countryCodes.length === newRankedCountryCodes.length) {
      screenReaderMessage += " All countries correctly ranked. Ready for the next round.";
    } else if (submissionsRemaining <= 0) {
      screenReaderMessage += ` The quiz has ended on round ${quiz.round}.`;
    }

    announceForScreenReaders(screenReaderMessage);

    setQuiz({
      ...quiz,
      countryCodesLockedInAsCorrect: newLockedInCountryCodes,
      submissionsRemaining,
    });
  }

  function onRemove(countryCode: Cca3Code) {
    setRankedCountryCodes(prev => prev.filter(code => code !== countryCode));
    announceForScreenReaders(`${storedCountryData.countries[countryCode]?.data?.name ?? countryCode} removed`);
  }

  function onAdd(countryCode: Cca3Code, rankIndex = -1) {
    // Handle adding from outside or moving from within
    const newRankedCountryCodes = rankedCountryCodes.filter(code => code !== countryCode);
    const moved = newRankedCountryCodes.length < rankedCountryCodes.length;
    const countryCodeAtIndex = rankedCountryCodes[rankIndex];
    const updatedIndex = newRankedCountryCodes.indexOf(countryCodeAtIndex);

    // If moving off the edge, cycle back around
    const updatedEffectiveIndex = updatedIndex >= 0 ? updatedIndex
      : (rankIndex < 0 ? newRankedCountryCodes.length : 0);
    newRankedCountryCodes.splice(updatedEffectiveIndex, 0, countryCode);

    setRankedCountryCodes(newRankedCountryCodes);
    announceForScreenReaders(`${storedCountryData.countries[countryCode]?.data?.name ?? countryCode
        } ${moved ? "moved to" : "added at"} rank ${updatedEffectiveIndex + 1}.`);
  }

  return (
    (quiz.type.structure !== "ranking") ? null : <>
      <p className="sr-only" aria-live="polite">{srAnnouncement}</p>

      <div className="quiz-controls">
        <DraggableCountryPool headerId="unranked-pool-header"
            headerText="Unranked Countries"
            emptyMessage="All countries have been ranked"
            selectedCountryCode={selectedCountryCode}
            onDrop={handleDropForUnrankedPool}>
          {unrankedCountryCodes.map((countryCode) => (
            <li key={countryCode}>
              <DraggableCountry cca3={countryCode}
                  revealedValueLabel={quizType.labelFunction(storedCountryData, independentOnly, countryCode)}
                  isSelected={countryCode === selectedCountryCode}
                  isDragged={countryCode === selectedCountryCode && isDraggingCountryCode}
                  roundActive={quiz.submissionsRemaining > 0
                      && quiz.countryCodesLockedInAsCorrect.length < quiz.countryCodes.length}
                  quizActive={quiz.submissionsRemaining > 0
                      || quiz.countryCodesLockedInAsCorrect.length >= quiz.countryCodes.length}
                  onDragStart={(event) => handleDragStart(event, countryCode)}
                  onDragEnd={handleDragEnd}
                  onDrag={handleDrag}
                  onAdd={() => onAdd(countryCode)} />
            </li>
          ))}
        </DraggableCountryPool>

        <DraggableCountryList headerId="ranked-list-header"
            headerText={`Countries Ranked by ${rankingTypeLabel}`}
            emptyMessage="Drag countries here to rank them"
            selectedCountryCode={selectedCountryCode}
            onDrop={handleDropForRankedList}>
          {rankedCountryCodes.map((countryCode, index) => (
            <li key={countryCode}>
              <DraggableCountry cca3={countryCode} rankIndex={index}
                  revealedValueLabel={quizType.labelFunction(storedCountryData, independentOnly, countryCode)}
                  isSelected={countryCode === selectedCountryCode}
                  isDragged={countryCode === selectedCountryCode && isDraggingCountryCode}
                  isLockedIn={quiz.countryCodesLockedInAsCorrect.includes(countryCode)}
                  roundActive={quiz.submissionsRemaining > 0
                      && quiz.countryCodesLockedInAsCorrect.length < quiz.countryCodes.length}
                  quizActive={quiz.submissionsRemaining > 0
                      || quiz.countryCodesLockedInAsCorrect.length >= quiz.countryCodes.length}
                  countryCodeBeingDraggedOver={countryCodeBeingDraggedOver}
                  onDragStart={(event) => handleDragStart(event, countryCode)}
                  onDragEnd={handleDragEnd}
                  onDrag={handleDrag}
                  onDragEnter={event => handleDragEnterForRankedListItem(event, countryCode)}
                  onDragOver={handleDragOver}
                  onDragLeave={event => handleDragLeaveForRankedListItem(event, countryCode)}
                  onDrop={handleDropForRankedListItem}
                  onMoveUp={() => onAdd(countryCode, index - 1)}
                  onMoveDown={() => onAdd(countryCode,
                      index + 2 === rankedCountryCodes.length ? -1 : index + 2)}
                  onRemove={() => onRemove(countryCode)} />
              </li>
            ))}
        </DraggableCountryList>
      </div>

      {quiz.countryCodesLockedInAsCorrect.length < quiz.countryCodes.length && <QuizSubmitButton
          onSubmit={attemptSubmit}
          disabled={rankedCountryCodes.length <= quiz.countryCodesLockedInAsCorrect.length
              || rankedCountryCodes.length < 2}
          submissionsRemaining={quiz.submissionsRemaining} />}
    </>
  );
}

export default QuizControlsForRanking;
