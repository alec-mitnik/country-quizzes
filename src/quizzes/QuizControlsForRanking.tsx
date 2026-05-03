import type { Cca3Code } from "@yusifaliyevpro/countries/types";
import { useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import useCountries from "../hooks/useCountries";
import { QUIZ_MAX_LEVEL, QUIZ_ONE_GO_TIP, QUIZ_ROUNDS_PER_LEVEL } from "../utils/consts";
import { getCountryNameFromCode, sortCountryCodesByName } from "../utils/countryUtils";
import { callFunctionWithViewTransition } from "../utils/utils";
import DraggableCountry from "./DraggableCountry";
import DraggableCountryList from "./DraggableCountryList";
import DraggableCountryPool from "./DraggableCountryPool";
import QuizSubmitButton from "./QuizSubmitButton";
import type { QuizState, RankingQuizState } from "./quizConfig";
import { isQuizActive } from "./quizUtils";

const CUSTOM_DRAG_TYPE = 'application/country-code';

interface QuizControlsForRankingProps {
  quizState: RankingQuizState;
  setQuizState: (quizState: QuizState) => void;
}

function QuizControlsForRanking({quizState, setQuizState}: QuizControlsForRankingProps) {
  const [selectedCountryCode, setSelectedCountryCode] = useState<Cca3Code | null>(null);
  const [isDraggingCountryCode, setIsDraggingCountryCode] = useState(false);
  const dragTestTimeoutIdRef = useRef<NodeJS.Timeout | number>(0);
  const [countryCodeBeingDraggedOver, setCountryCodeBeingDraggedOver] =
      useState<Cca3Code | null>(null);

  // Announcement for screen readers
  const [srAnnouncement, setSrAnnouncement] = useState('');
  const srAnnouncementTimeoutIdRef = useRef<NodeJS.Timeout | number>(0);

  const alreadyGuessed = useMemo(() => {
    for (const incorrectSubmission of quizState.incorrectSubmissions) {
      if (incorrectSubmission.toString() === quizState.rankedCountryCodes.toString()) {
        return true;
      }
    };

    return false;
  }, [quizState.rankedCountryCodes, quizState.incorrectSubmissions]);

  const quizActive = isQuizActive(quizState);
  const roundActive = quizActive && quizState.submissionsRemaining > 0
      && quizState.countryCodesLockedInAsCorrect.length < quizState.countryCodes.length;

  function setRankedCountryCodes(rankedCountryCodes: Cca3Code[]) {
    setQuizState({
      ...quizState,
      rankedCountryCodes,
    });
  }

  useEffect(() => {
    // Reset state when the country codes change for a new round
    setSelectedCountryCode(null);
    setIsDraggingCountryCode(false);

    return () => {
      clearTimeout(srAnnouncementTimeoutIdRef.current);
      clearTimeout(dragTestTimeoutIdRef.current);
    };
  }, [quizState.countryCodes]);

  const { independentOnly, storedCountryData } = useCountries();

  const rankingTypeLabel = quizState.quiz.rankingTypeLabel;

  const unrankedCountryCodes = useMemo(() => {
    const unrankedCodes = quizState.countryCodes.filter(
      (countryCode) => !quizState.rankedCountryCodes.includes(countryCode));

    // Sort alphabetically by country name
    sortCountryCodesByName(unrankedCodes, storedCountryData.countries);

    return unrankedCodes;
  }, [quizState.rankedCountryCodes, storedCountryData.countries, quizState.countryCodes]);

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
        const rankIndex = quizState.rankedCountryCodes.indexOf(itemCountryCode);
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
    if (quizState.rankedCountryCodes.length !== 0 && selectedCountryCode
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

    // For a correct submission, clear out previous incorrect submissions
    let incorrectSubmissions: Cca3Code[][] = [];

    // Submission is correct if all ranked values go in descending order
    for (const countryCode of quizState.rankedCountryCodes) {
      const currentValue = quizState.quiz.valueFunction(storedCountryData, countryCode);

      if (currentValue > previousValue) {
        submissionCorrect = false;
        break;
      }

      previousValue = currentValue;
    }

    let newRankedCountryCodes = quizState.rankedCountryCodes;
    let newLockedInCountryCodes = quizState.countryCodesLockedInAsCorrect;

    const submissionsRemaining = quizState.submissionsRemaining - 1;
    let screenReaderMessage = "";

    if (!submissionCorrect) {
      // Record the incorrect submission
      incorrectSubmissions = [...quizState.incorrectSubmissions,
          [...newRankedCountryCodes]];

      // Clear out any non-locked-in countries
      newRankedCountryCodes = quizState.rankedCountryCodes.filter(
          code => quizState.countryCodesLockedInAsCorrect.includes(code));

      // Briefly animate the ranked list shaking
      const rankedListElement = document.querySelector('.draggable-country-list');

      if (rankedListElement) {
        rankedListElement.classList.add('shake');
        setTimeout(() => rankedListElement.classList.remove('shake'), 500);
      }

      // Sound effect..

      screenReaderMessage = "Submission incorrect.";
    } else {
      screenReaderMessage = "Submission correct and locked-in.";
      newLockedInCountryCodes = [...newRankedCountryCodes];
    }

    screenReaderMessage += ` ${submissionsRemaining} submission${
          submissionsRemaining === 1 ? "" : "s"} remaining.`;

    if (quizState.countryCodes.length === newRankedCountryCodes.length) {
      if (quizState.level >= QUIZ_MAX_LEVEL && quizState.round >= QUIZ_ROUNDS_PER_LEVEL) {
        screenReaderMessage += " All countries correctly ranked. You beat the quiz!";
      } else {
        screenReaderMessage += " All countries correctly ranked. Ready for the next round.";
      }
    } else if (submissionsRemaining <= 0) {
      screenReaderMessage += ` The quiz has ended on level ${quizState.level}, round ${quizState.round}.`;
    }

    announceForScreenReaders(screenReaderMessage);

    setQuizState({
      ...quizState,
      rankedCountryCodes: newRankedCountryCodes,
      countryCodesLockedInAsCorrect: newLockedInCountryCodes,
      submissionsRemaining,
      incorrectSubmissions,
    });
  }

  function onRemove(countryCode: Cca3Code) {
    callFunctionWithViewTransition(() => {
      setRankedCountryCodes(quizState.rankedCountryCodes.filter(code => code !== countryCode));
    }, isDraggingCountryCode, () => {
      announceForScreenReaders(`${getCountryNameFromCode(countryCode, storedCountryData.countries)} removed`);
    });
  }

  function onAdd(countryCode: Cca3Code, rankIndex = -1) {
    // Handle adding from outside or moving from within
    const newRankedCountryCodes = quizState.rankedCountryCodes.filter(code => code !== countryCode);
    const moved = newRankedCountryCodes.length < quizState.rankedCountryCodes.length;
    const countryCodeAtIndex = quizState.rankedCountryCodes[rankIndex]!;
    const updatedIndex = newRankedCountryCodes.indexOf(countryCodeAtIndex);

    // If moving off the edge, cycle back around
    const updatedEffectiveIndex = updatedIndex >= 0 ? updatedIndex
      : (rankIndex < 0 ? newRankedCountryCodes.length : 0);
    newRankedCountryCodes.splice(updatedEffectiveIndex, 0, countryCode);

    callFunctionWithViewTransition(() => {
      setRankedCountryCodes(newRankedCountryCodes);
    }, isDraggingCountryCode, () => {
      announceForScreenReaders(`${getCountryNameFromCode(countryCode, storedCountryData.countries)
          } ${moved ? "moved to" : "added at"} rank ${updatedEffectiveIndex + 1}.`);
    });
  }

  const unrankedPoolHeader = "Unranked Countries";

  return (
    (quizState.quiz.structure !== "ranking") ? null : <>
      <p className="sr-only" aria-live="polite">{srAnnouncement}</p>

      <div className="quiz-controls">
        <DraggableCountryPool headerId="unranked-pool-header"
            headerLabel={unrankedPoolHeader}
            headerText={unrankedPoolHeader}
            emptyMessage="All countries have been ranked"
            selectedCountryCode={selectedCountryCode}
            onDrop={handleDropForUnrankedPool}>
          {unrankedCountryCodes.map((countryCode) => (
            <li key={countryCode} style={{ viewTransitionName: countryCode }}>
              <DraggableCountry cca3={countryCode}
                  revealedValueLabel={quizState.quiz.labelFunction(
                      storedCountryData, independentOnly, countryCode)}
                  isSelected={countryCode === selectedCountryCode}
                  isDragged={countryCode === selectedCountryCode && isDraggingCountryCode}
                  roundActive={roundActive}
                  quizActive={quizActive}
                  quizType={quizState.quiz.type}
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
          {quizState.rankedCountryCodes.map((countryCode, index) => (
            <li key={countryCode} style={{ viewTransitionName: countryCode }}>
              <DraggableCountry cca3={countryCode} rankIndex={index}
                  revealedValueLabel={quizState.quiz.labelFunction(
                      storedCountryData, independentOnly, countryCode)}
                  isSelected={countryCode === selectedCountryCode}
                  isDragged={countryCode === selectedCountryCode && isDraggingCountryCode}
                  isLockedIn={quizState.countryCodesLockedInAsCorrect.includes(countryCode)}
                  roundActive={roundActive}
                  quizActive={quizActive}
                  quizType={quizState.quiz.type}
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
                      index + 2 === quizState.rankedCountryCodes.length ? -1 : index + 2)}
                  onRemove={() => onRemove(countryCode)} />
              </li>
            ))}
        </DraggableCountryList>
      </div>

      {/* Reminder that you don't have to submit everything in one go */}
      {roundActive && !quizState.countryCodesLockedInAsCorrect.length
          && !!quizState.incorrectSubmissions.length
          && quizState.incorrectSubmissions[quizState.incorrectSubmissions.length - 1]!.length
              === quizState.countryCodes.length
          && <p className="quiz-message" aria-live="polite">
        Remember: {QUIZ_ONE_GO_TIP}
      </p>}

      {quizState.countryCodesLockedInAsCorrect.length < quizState.countryCodes.length && <QuizSubmitButton
          onSubmit={attemptSubmit}
          alreadyGuessed={alreadyGuessed}
          disabled={quizState.rankedCountryCodes.length <= quizState.countryCodesLockedInAsCorrect.length
              || quizState.rankedCountryCodes.length < 2}
          submissionsRemaining={quizState.submissionsRemaining} />}
    </>
  );
}

export default QuizControlsForRanking;
