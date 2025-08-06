import type { Cca3Code } from "@yusifaliyevpro/countries/types";
import { useCallback, useMemo, useState, type DragEvent } from "react";
import useCountries from "../hooks/useCountries";
import type Quiz from "../pages/Quiz";
import DraggableCountry from "./DraggableCountry";
import QuizSubmitButton from "./QuizSubmitButton";

const CUSTOM_DRAG_TYPE = 'application/country-code';

interface QuizControlsForRankingProps {
  quiz: Quiz;
  setQuiz: (quiz: Quiz) => void;
}

function QuizControlsForRanking({quiz, setQuiz}: QuizControlsForRankingProps) {
  const [rankedCountryCodes, setRankedCountryCodes] = useState<Cca3Code[]>([]);
  const [selectedCountryCode, setSelectedCountryCode] = useState<Cca3Code | null>(null);
  const [isDraggingOverRankedList, setIsDraggingOverRankedList] = useState(false);
  const [isDraggingOverUnrankedPool, setIsDraggingOverUnrankedPool] = useState(false);
  const [isDraggingCountryCode, setIsDraggingCountryCode] = useState(false);

  // TODO - change how drop works to be more intuitive so that top half of item goes above,
  // bottom half goes below, above top item is first, below last item is last,
  // and to the sides of items is not valid
  const [countryCodeBeingDraggedOver, setCountryCodeBeingDraggedOver] =
      useState<Cca3Code | null>(null);

  // Announcement for screen readers
  const [srAnnouncement, setSrAnnouncement] = useState('');
  const [srAnnouncementTimeoutId, setSrAnnouncementTimeoutId] = useState(0);

  const { independentOnly, storedCountryData } = useCountries();

  const rankingTypeLabel = quiz.type.key === "ORDER_BY_POPULATION" ? "Population" : "Size";

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
    clearTimeout(srAnnouncementTimeoutId);
    setSrAnnouncement(message);

    // Clear the message after a delay so that it doesn't remain
    // navigable by screen readers in browse mode
    setSrAnnouncementTimeoutId(setTimeout(() => setSrAnnouncement(''), 1000));
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
  }

  function handleDragEnd() {
    // Note that this won't get triggered if the dragged element
    // is unmounted in the drop handler, so drop handlers that
    // move elements need to clear the selection themselves
    setSelectedCountryCode(null);
    setIsDraggingCountryCode(false);
    setCountryCodeBeingDraggedOver(null);
    setIsDraggingOverRankedList(false);
    setIsDraggingOverUnrankedPool(false);
  }

  function handleDragOver(event: DragEvent) {
    if (event.dataTransfer.types.every(type => type === CUSTOM_DRAG_TYPE)) {
      event.preventDefault();
    }
  }

  function handleDragEnterForUnrankedPool(event: DragEvent) {
    if (event.dataTransfer.types.every(type => type === CUSTOM_DRAG_TYPE)) {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
      setIsDraggingOverUnrankedPool(true);
    } else {
      event.dataTransfer.dropEffect = 'none';
    }
  }

  function handleDragLeaveForUnrankedPool(event: DragEvent) {
    if (event.dataTransfer.types.every(type => type === CUSTOM_DRAG_TYPE)) {
      event.preventDefault();
      setIsDraggingOverUnrankedPool(false);
    }
  }

  function handleDragEnterForRankedListItem(event: DragEvent, itemCountryCode: Cca3Code) {
    if (selectedCountryCode && selectedCountryCode !== itemCountryCode
        && event.dataTransfer.types.every(type => type === CUSTOM_DRAG_TYPE)) {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
      setCountryCodeBeingDraggedOver(itemCountryCode);
      setIsDraggingOverRankedList(false);
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

  function handleDragEnterForRankedList(event: DragEvent) {
    const isRankedList = event.target instanceof HTMLElement
        && event.target.matches('.ranked-list');
    if (isRankedList && selectedCountryCode
        && event.dataTransfer.types.every(type => type === CUSTOM_DRAG_TYPE)) {
      event.preventDefault();
      setIsDraggingOverRankedList(true);
      event.dataTransfer.dropEffect = 'move';
    } else {
      event.dataTransfer.dropEffect = 'none';
    }
  }

  function handleDragLeaveForRankedList(event: DragEvent) {
    const isRankedList = event.target instanceof HTMLElement
        && event.target.matches('.ranked-list');
    if (isRankedList
        && event.dataTransfer.types.every(type => type === CUSTOM_DRAG_TYPE)) {
      event.preventDefault();
      setIsDraggingOverRankedList(false);
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

  function getValueForRanking(countryCode: Cca3Code) {
    switch (quiz.type.key) {
      case "ORDER_BY_SIZE":
        return storedCountryData.countries[countryCode]?.data?.area?.rawValue ?? 0;
      case "ORDER_BY_POPULATION":
        return storedCountryData.countries[countryCode]?.data?.population?.rawValue ?? 0;
      default:
        return 0;
    }
  }

  const getRankedValueLabel = useCallback((countryCode: Cca3Code) => {
    const fieldName = independentOnly ? "formattedValueForIndependentOnly" : "formattedValueForAll";

    switch (quiz.type.key) {
      case "ORDER_BY_SIZE":
        return `${storedCountryData.countries[countryCode]?.data?.area?.[fieldName]}`;
      case "ORDER_BY_POPULATION":
        return `${storedCountryData.countries[countryCode]?.data?.population?.[fieldName]}`;
      default:
        return "";
    }
  }, [independentOnly, storedCountryData.countries, quiz.type.key]);

  function attemptSubmit() {
    let submissionCorrect = true;
    let previousValue = Number.MAX_SAFE_INTEGER;

    // Submission is correct if all ranked values go in descending order
    for (const countryCode of rankedCountryCodes) {
      const currentValue = getValueForRanking(countryCode);

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
      const rankedListElement = document.querySelector('.ranked-list');

      if (rankedListElement) {
        rankedListElement.classList.add('shake');
        setTimeout(() => rankedListElement.classList.remove('shake'), 500);
      }

      // TODO - sound effect

      screenReaderMessage = `Submission incorrect.`;
    } else {
      screenReaderMessage = `Submission correct and locked-in.`;
    }

    screenReaderMessage += ` ${submissionsRemaining} submission${
          submissionsRemaining === 1 ? "" : "s"} remaining.`;

    if (quiz.countryCodes.length
          === quiz.countryCodesLockedInAsCorrect.length) {
      screenReaderMessage += ` All countries correctly ranked. Ready for the next round.`;
    } else if (submissionsRemaining <= 0) {
      screenReaderMessage += ` The quiz has ended on round ${quiz.round}.`;
    }

    announceForScreenReaders(screenReaderMessage);

    setQuiz({
      ...quiz,
      countryCodesLockedInAsCorrect: newRankedCountryCodes,
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

      <div className="quiz-controls-for-ranking">
        <section className={`unranked-pool ${isDraggingOverUnrankedPool ? "being-dragged-over" : ""}`}
            aria-labelledby="unranked-pool-header"
            onDragEnter={event => handleDragEnterForUnrankedPool(event)}
            onDragOver={handleDragOver}
            onDragLeave={event => handleDragLeaveForUnrankedPool(event)}
            onDrop={handleDropForUnrankedPool}>
          <h2 id="unranked-pool-header">Unranked Countries</h2>

          {unrankedCountryCodes.length === 0 ? <p>All countries have been ranked</p>
              : unrankedCountryCodes.map((countryCode) => (
            <DraggableCountry key={countryCode} cca3={countryCode}
                rankedValueLabel={getRankedValueLabel(countryCode)}
                isSelected={countryCode === selectedCountryCode}
                isDragged={countryCode === selectedCountryCode && isDraggingCountryCode}
                roundActive={quiz.submissionsRemaining > 0
                    && quiz.countryCodesLockedInAsCorrect.length < quiz.countryCodes.length}
                quizActive={quiz.submissionsRemaining > 0
                    || quiz.countryCodesLockedInAsCorrect.length >= quiz.countryCodes.length}
                onDragStart={(event) => handleDragStart(event, countryCode)}
                onDragEnd={handleDragEnd}
                onAdd={() => onAdd(countryCode)} />
          ))}
        </section>

        <section className={`ranked-list ${isDraggingOverRankedList ? "being-dragged-over" : ""}`}
            aria-labelledby="ranked-list-header"
            onDragEnter={event => handleDragEnterForRankedList(event)}
            onDragOver={handleDragOver}
            onDragLeave={event => handleDragLeaveForRankedList(event)}
            onDrop={handleDropForRankedList}>
          <h2 id="ranked-list-header">Countries Ranked by {rankingTypeLabel}</h2>

          {rankedCountryCodes.length === 0 ? <p>Drag countries here to rank them</p>
              : rankedCountryCodes.map((countryCode, index) => (
            <DraggableCountry key={countryCode} cca3={countryCode} rankIndex={index}
                rankedValueLabel={getRankedValueLabel(countryCode)}
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
                onDragEnter={event => handleDragEnterForRankedListItem(event, countryCode)}
                onDragOver={handleDragOver}
                onDragLeave={event => handleDragLeaveForRankedListItem(event, countryCode)}
                onDrop={handleDropForRankedListItem}
                onMoveUp={() => onAdd(countryCode, index - 1)}
                onMoveDown={() => onAdd(countryCode,
                    index + 2 === rankedCountryCodes.length ? -1 : index + 2)}
                onRemove={() => onRemove(countryCode)} />
          ))}
        </section>
      </div>

      {quiz.countryCodesLockedInAsCorrect.length < quiz.countryCodes.length && <QuizSubmitButton
          onSubmit={attemptSubmit}
          disabled={rankedCountryCodes.length <= quiz.countryCodesLockedInAsCorrect.length}
          submissionsRemaining={quiz.submissionsRemaining} />}
    </>
  );
}

export default QuizControlsForRanking;
