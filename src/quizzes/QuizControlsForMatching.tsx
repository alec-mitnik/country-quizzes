import type { Cca3Code } from "@yusifaliyevpro/countries/types";
import { useMemo, useState, type DragEvent } from "react";
import useCountries from "../hooks/useCountries";
import type Quiz from "../pages/Quiz";
import type { MatchingQuizType } from "../pages/Quiz";
import { CUSTOM_DRAG_TYPE } from "../utils/consts";
import DraggableCountry from "./DraggableCountry";
import DraggableCountryPool from "./DraggableCountryPool";
import QuizSubmitButton from "./QuizSubmitButton";

interface QuizControlsForMatchingProps {
  quiz: Quiz;
  setQuiz: (quiz: Quiz) => void;
}

function QuizControlsForMatching({quiz, setQuiz}: QuizControlsForMatchingProps) {
  // Use sorted match value index as the key to allow for duplicate values.
  // Use Object.values() to get the matched country codes/count.
  const [matchedCountryCodes, setMatchedCountryCodes] =
      useState<Partial<Record<number, Cca3Code>>>({});
  const [selectedCountryCode, setSelectedCountryCode] =
      useState<Cca3Code | null>(null);
  const [isDraggingCountryCode, setIsDraggingCountryCode] = useState(false);

  // Announcement for screen readers
  const [srAnnouncement, setSrAnnouncement] = useState<React.ReactNode>('');
  const [srAnnouncementTimeoutId, setSrAnnouncementTimeoutId] = useState(0);

  const { storedCountryData } = useCountries();

  const quizType = quiz.type as MatchingQuizType;

  // TODO - support more match types
  const matchTypeLabel = quizType.key === "MATCH_NAMES_TO_CAPITALS" ? "Capitals" : "Currencies";

  const sortedMatchValues = useMemo(() => {
    const matchValues: {value: string, label: React.ReactNode}[]
        = quiz.countryCodes.map((countryCode) => {
      return {
        value: quizType.valueFunction(storedCountryData, countryCode),
        label: quizType.labelFunction(storedCountryData, countryCode),
      };
    });

    // Sort alphabetically by value (avoiding markup parsing with the label)
    matchValues.sort((a, b) => {
      return a.value.localeCompare(b.value);
    });

    return matchValues;
  }, [storedCountryData, quizType, quiz.countryCodes]);

  const unmatchedCountryCodes = useMemo(() => {
    const unmatchedCodes = quiz.countryCodes.filter((countryCode) =>
        !Object.values(matchedCountryCodes).includes(countryCode));

    // Sort alphabetically by country name
    unmatchedCodes.sort((a, b) => {
      return storedCountryData.countries[a]?.data?.name
          .localeCompare(storedCountryData.countries[b]?.data?.name ?? "") ?? 0;
    });

    return unmatchedCodes;
  }, [matchedCountryCodes, storedCountryData.countries, quiz.countryCodes]);

  function announceForScreenReaders(message: React.ReactNode) {
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
  }

  function handleDropForMatchValue(event: DragEvent, index: number) {
    if (selectedCountryCode
        && event.dataTransfer.types.every(type => type === CUSTOM_DRAG_TYPE)) {
      event.preventDefault();
      event.stopPropagation();
      onAdd(selectedCountryCode, index);
      handleDragEnd();
    }
  }

  function handleDropForUnmatchedPool(event: DragEvent) {
    if (selectedCountryCode
        && event.dataTransfer.types.every(type => type === CUSTOM_DRAG_TYPE)) {
      event.preventDefault();
      event.stopPropagation();
      onRemove(selectedCountryCode);
      handleDragEnd();
    }
  }

  function attemptSubmit() {
    let submissionCorrect = true;

    // Submission is correct if all matched (non-blank) values are correct
    for (const [index, countryCode] of Object.entries(matchedCountryCodes)) {
      const matchedValue = sortedMatchValues[parseInt(index)].value;

      if (!matchedValue || !countryCode) {
        continue;
      }

      const correctValue = quizType.valueFunction(storedCountryData, countryCode);

      if (correctValue !== matchedValue) {
        submissionCorrect = false;
        break;
      }
    }

    const newMatchedCountryCodes = {...matchedCountryCodes};

    const submissionsRemaining = quiz.submissionsRemaining - 1;
    const screenReaderMessageParts: React.ReactNode[] = [];

    if (!submissionCorrect) {
      // Submission was incorrect, so clear out any non-locked-in countries
      for (const [index, countryCode] of Object.entries(matchedCountryCodes)) {
        if (!countryCode || !quiz.countryCodesLockedInAsCorrect.includes(countryCode)) {
          delete newMatchedCountryCodes[parseInt(index)];
        }
      }

      setMatchedCountryCodes(newMatchedCountryCodes);

      // Briefly animate the matched list shaking
      const matchedListElement = document.querySelector('.draggable-country-pool.target-container');

      if (matchedListElement) {
        matchedListElement.classList.add('shake');
        setTimeout(() => matchedListElement.classList.remove('shake'), 500);
      }

      // TODO - sound effect

      screenReaderMessageParts.push("Submission incorrect.");
    } else {
      screenReaderMessageParts.push("Submission correct and locked-in.");
    }

    screenReaderMessageParts.push(` ${submissionsRemaining} submission${
          submissionsRemaining === 1 ? "" : "s"} remaining.`);

    const newLockedInCountryCodes = Object.values(newMatchedCountryCodes) as Cca3Code[]

    if (quiz.countryCodes.length === newLockedInCountryCodes.length) {
      screenReaderMessageParts.push(" All countries correctly matched. Ready for the next round.");
    } else if (submissionsRemaining <= 0) {
      screenReaderMessageParts.push(" The quiz has ended on round ${quiz.round}.");
    }

    announceForScreenReaders(<>{screenReaderMessageParts}</>);

    setQuiz({
      ...quiz,
      countryCodesLockedInAsCorrect: newLockedInCountryCodes,
      submissionsRemaining,
    });
  }

  function onRemove(countryCode: Cca3Code) {
    const index = Object.keys(matchedCountryCodes).find(indexStr =>
        matchedCountryCodes[parseInt(indexStr)] === countryCode);

    if (index) {
      const parsedIndex = parseInt(index);
      const matchedData = sortedMatchValues[parsedIndex];

      setMatchedCountryCodes(prev => {
        const next = {...prev};
        delete next[parsedIndex];
        return next;
      });

      announceForScreenReaders(<>{storedCountryData.countries[countryCode]?.data?.name ?? countryCode
          } unmatched from {matchedData.label}.</>);
    }
  }

  // Add to the slot at the designated index if provided,
  // or else to the first empty one.  If the provided index
  // is occupied and not locked-in, swap with the country code there.
  // If it is locked-in, do nothing. Also handles if dragged from another index.
  function onAdd(countryCode: Cca3Code, index = -1) {
    const countryCodeAtSlot = matchedCountryCodes[index];

    if (countryCodeAtSlot && quiz.countryCodesLockedInAsCorrect.includes(countryCodeAtSlot)) {
      return;
    }

    if (index < 0) {
      // No designated slot, so find the first empty slot
      for (let i = 0; i < sortedMatchValues.length; i++) {
        if (!matchedCountryCodes[i]) {
          index = i;
          break;
        }
      }
    }

    const currentCountryCodeIndex = Object.keys(matchedCountryCodes).find(indexStr =>
        matchedCountryCodes[parseInt(indexStr)] === countryCode);

    if (index >= 0 && String(index) !== currentCountryCodeIndex) {
      setMatchedCountryCodes(prev => {
        const next = {...prev};

        if (currentCountryCodeIndex) {
          if (countryCodeAtSlot) {
            next[parseInt(currentCountryCodeIndex)] = countryCodeAtSlot;
          } else {
            delete next[parseInt(currentCountryCodeIndex)];
          }
        }

        next[index] = countryCode;
        return next;
      });

      announceForScreenReaders(<>{storedCountryData.countries[countryCode]?.data?.name ?? countryCode
          } now matched to {sortedMatchValues[index].label}{countryCodeAtSlot ? `, swapped with ${
            storedCountryData.countries[countryCodeAtSlot]?.data?.name ?? countryCodeAtSlot
          }` : ""}.</>);
    }
  }

  // Move to previous non-locked-in index in the sortedMatchValues order,
  // looping around if the first one, and swapping with the country code there, if any
  function onMoveUp(countryCode: Cca3Code) {
    const matchValueIndex = Object.keys(matchedCountryCodes).find(indexStr =>
        matchedCountryCodes[parseInt(indexStr)] === countryCode);

    if (!matchValueIndex) {
      return;
    }

    const parsedMatchValueIndex = parseInt(matchValueIndex);

    if (!matchedCountryCodes[parsedMatchValueIndex]) {
      return;
    }

    let newMatchValueIndex = -1;
    let countryCodeAtSlot: Cca3Code | undefined;

    for (let i = parsedMatchValueIndex - 1; i !== parsedMatchValueIndex; i--) {
      if (i < 0) {
        i = sortedMatchValues.length;
        continue;
      }

      countryCodeAtSlot = matchedCountryCodes[i];

      if (countryCodeAtSlot
          && quiz.countryCodesLockedInAsCorrect.includes(countryCodeAtSlot)) {
        continue;
      }

      newMatchValueIndex = i;
      break;
    }

    if (newMatchValueIndex < 0) {
      announceForScreenReaders("No available slots to move to.");
      return;
    }

    setMatchedCountryCodes(prev => {
      const next = {...prev};

      if (countryCodeAtSlot) {
        next[parsedMatchValueIndex] = countryCodeAtSlot;
      } else {
        delete next[parsedMatchValueIndex];
      }

      next[newMatchValueIndex] = countryCode;
      return next;
    });

    announceForScreenReaders(<>{storedCountryData.countries[countryCode]?.data?.name ?? countryCode
        } moved up, now matched to {sortedMatchValues[newMatchValueIndex].label}{
        countryCodeAtSlot ? `, swapped with ${
          storedCountryData.countries[countryCodeAtSlot]?.data?.name ?? countryCodeAtSlot
        }.` : ""}</>);
  }

  // Move to next non-locked-in index in the sortedMatchValues order,
  // looping around if the last one, and swapping with the country code there, if any
  function onMoveDown(countryCode: Cca3Code) {
    const matchValueIndex = Object.keys(matchedCountryCodes).find(indexStr =>
        matchedCountryCodes[parseInt(indexStr)] === countryCode);

    if (!matchValueIndex) {
      return;
    }

    const parsedMatchValueIndex = parseInt(matchValueIndex);

    if (!matchedCountryCodes[parsedMatchValueIndex]) {
      return;
    }

    let newMatchValueIndex = -1;
    let countryCodeAtSlot: Cca3Code | undefined;

    for (let i = parsedMatchValueIndex + 1; i !== parsedMatchValueIndex; i++) {
      if (i >= sortedMatchValues.length) {
        i = -1;
        continue;
      }

      countryCodeAtSlot = matchedCountryCodes[i];

      if (countryCodeAtSlot
          && quiz.countryCodesLockedInAsCorrect.includes(countryCodeAtSlot)) {
        continue;
      }

      newMatchValueIndex = i;
      break;
    }

    if (newMatchValueIndex < 0) {
      announceForScreenReaders("No available slots to move to.");
      return;
    }

    setMatchedCountryCodes(prev => {
      const next = {...prev};

      if (countryCodeAtSlot) {
        next[parsedMatchValueIndex] = countryCodeAtSlot;
      } else {
        delete next[parsedMatchValueIndex];
      }

      next[newMatchValueIndex] = countryCode;
      return next;
    });

    announceForScreenReaders(<>{storedCountryData.countries[countryCode]?.data?.name ?? countryCode
        } moved down, now matched to {sortedMatchValues[newMatchValueIndex].label}{
        countryCodeAtSlot ? `, swapped with ${
          storedCountryData.countries[countryCodeAtSlot]?.data?.name ?? countryCodeAtSlot
        }.` : ""}</>);
  }

  return (
    (quiz.type.structure !== "matching") ? null : <>
      <p className="sr-only" aria-live="polite">{srAnnouncement}</p>

      <div className="quiz-controls">
        <DraggableCountryPool headerId="unmatched-pool-header"
            headerText="Unmatched Countries"
            emptyMessage="All countries have been matched"
            onDrop={handleDropForUnmatchedPool}>
          {unmatchedCountryCodes.map((countryCode) => (
            <li key={countryCode}>
              <DraggableCountry cca3={countryCode}
                  revealedValueLabel={quizType.labelFunction(storedCountryData, countryCode)}
                  isSelected={countryCode === selectedCountryCode}
                  isDragged={countryCode === selectedCountryCode && isDraggingCountryCode}
                  roundActive={quiz.submissionsRemaining > 0
                      && quiz.countryCodesLockedInAsCorrect.length < quiz.countryCodes.length}
                  quizActive={quiz.submissionsRemaining > 0
                      || quiz.countryCodesLockedInAsCorrect.length >= quiz.countryCodes.length}
                  onDragStart={(event) => handleDragStart(event, countryCode)}
                  onDragEnd={handleDragEnd}
                  onAdd={() => onAdd(countryCode)} />
            </li>
          ))}
        </DraggableCountryPool>

        <DraggableCountryPool headerId="matched-pool-header"
            headerText={`Country ${matchTypeLabel} to Match to`}
            canBeDroppedIntoDirectly={false}
            isTargetContainer
            emptyMessage="Error">
          {sortedMatchValues.map((matchData, index) => {
            const countryCodeMatchValueIsMatchedTo = matchedCountryCodes[index];

            // Use the country code as the key when possible, so that focus remains
            // on the country component's buttons when moved up/down
            return (
              <li key={countryCodeMatchValueIsMatchedTo ?? index}>
                <DraggableCountryPool headerId="matched-pool-header"
                    headerText={matchData.label}
                    headerLevel={3}
                    singleCapacity
                    canBeDroppedIntoDirectly={!countryCodeMatchValueIsMatchedTo
                        || !quiz.countryCodesLockedInAsCorrect.includes(countryCodeMatchValueIsMatchedTo)}
                    emptyMessage="Drag the matching country here"
                    onDrop={event => handleDropForMatchValue(event, index)}>
                  {countryCodeMatchValueIsMatchedTo ? (
                    <DraggableCountry cca3={countryCodeMatchValueIsMatchedTo}
                      isSelected={countryCodeMatchValueIsMatchedTo === selectedCountryCode}
                      isDragged={countryCodeMatchValueIsMatchedTo === selectedCountryCode
                          && isDraggingCountryCode}
                      isLockedIn={quiz.countryCodesLockedInAsCorrect
                          .includes(countryCodeMatchValueIsMatchedTo)}
                      roundActive={quiz.submissionsRemaining > 0
                          && quiz.countryCodesLockedInAsCorrect.length < quiz.countryCodes.length}
                      quizActive={quiz.submissionsRemaining > 0
                          || quiz.countryCodesLockedInAsCorrect.length >= quiz.countryCodes.length}
                      onDragStart={(event) => handleDragStart(event, countryCodeMatchValueIsMatchedTo)}
                      onDragEnd={handleDragEnd}
                      onMoveUp={() => onMoveUp(countryCodeMatchValueIsMatchedTo)}
                      onMoveDown={() => onMoveDown(countryCodeMatchValueIsMatchedTo)}
                      onRemove={() => onRemove(countryCodeMatchValueIsMatchedTo)} />
                  ) : null}
                </DraggableCountryPool>
              </li>
            );
          })}
        </DraggableCountryPool>
      </div>

      {quiz.countryCodesLockedInAsCorrect.length < quiz.countryCodes.length && <QuizSubmitButton
          onSubmit={attemptSubmit}
          disabled={Object.keys(matchedCountryCodes).length <= quiz.countryCodesLockedInAsCorrect.length}
          submissionsRemaining={quiz.submissionsRemaining} />}
    </>
  );
}

export default QuizControlsForMatching;
