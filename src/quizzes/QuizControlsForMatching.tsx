import type { Cca3Code } from "@yusifaliyevpro/countries/types";
import { useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import useCountries from "../hooks/useCountries";
import { CUSTOM_DRAG_TYPE } from "../utils/consts";
import { getLocatorMapSrc, getReactNodeString } from "../utils/utils";
import CaptionedImageForMatching from "./CaptionedImageForMatching";
import DraggableCountry from "./DraggableCountry";
import DraggableCountryPool from "./DraggableCountryPool";
import QuizSubmitButton from "./QuizSubmitButton";
import type { MatchingQuizState, QuizState } from "./quizConfig";

interface QuizControlsForMatchingProps {
  quizState: MatchingQuizState;
  setQuizState: (quizState: QuizState) => void;
}

function QuizControlsForMatching({quizState, setQuizState}: QuizControlsForMatchingProps) {
  const [selectedCountryCode, setSelectedCountryCode] =
      useState<Cca3Code | null>(null);
  const [isDraggingCountryCode, setIsDraggingCountryCode] = useState(false);
  const dragTestTimeoutIdRef = useRef<NodeJS.Timeout | number>(0);

  // Announcement for screen readers
  const [srAnnouncement, setSrAnnouncement] = useState<React.ReactNode>('');
  const srAnnouncementTimeoutIdRef = useRef<NodeJS.Timeout | number>(0);

  const alreadyGuessed = useMemo(() => {
    for (const incorrectSubmission of quizState.incorrectSubmissions) {
      if (incorrectSubmission.toString() ===
          Object.entries(quizState.matchedCountryCodes).toString()) {
        return true;
      }
    };

    return false;
  }, [quizState.matchedCountryCodes, quizState.incorrectSubmissions]);

  function setMatchedCountryCodes(matchedCountryCodes: Partial<Record<number, Cca3Code>>) {
    setQuizState({
      ...quizState,
      matchedCountryCodes,
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

  const { storedCountryData } = useCountries();

  const sortedMatchValues = useMemo(() => {
    const matchValues: {cca3: Cca3Code, value: string, label: React.ReactNode}[]
        = quizState.countryCodes.map((countryCode) => {
      const value = quizState.quiz.valueFunction(storedCountryData, countryCode);
      let label = quizState.quiz.labelFunction(storedCountryData, countryCode);

      if (quizState.quiz.type === "MATCH_TO_FLAGS") {
        label = <CaptionedImageForMatching
            src={storedCountryData.countries[countryCode]?.data?.flag}
            imageTerm="Flag"
            caption={getReactNodeString(label,
                "The flag of this country. No additional description available.")} />
      } else if (quizState.quiz.type === "MATCH_TO_LOCATIONS") {
        const key = storedCountryData.countries[countryCode]?.data?.worldFactbookCountryKey;

        label = <CaptionedImageForMatching
            src={key ? getLocatorMapSrc(key) : undefined}
            imageTerm="Location"
            caption={getReactNodeString(label,
                "The location of this country. No additional description available.")} />
      }

      return {
        cca3: countryCode,
        value,
        label,
      };
    });

    // Sort alphabetically by value (avoiding markup parsing with the label)
    matchValues.sort((a, b) => {
      return a.value.localeCompare(b.value);
    });

    return matchValues;
  }, [storedCountryData, quizState.quiz, quizState.countryCodes]);

  const unmatchedCountryCodes = useMemo(() => {
    const unmatchedCodes = quizState.countryCodes.filter((countryCode) =>
        !Object.values(quizState.matchedCountryCodes).includes(countryCode));

    // Sort alphabetically by country name
    unmatchedCodes.sort((a, b) => {
      return storedCountryData.countries[a]?.data?.name
          .localeCompare(storedCountryData.countries[b]?.data?.name ?? "") ?? 0;
    });

    return unmatchedCodes;
  }, [quizState.matchedCountryCodes, storedCountryData.countries, quizState.countryCodes]);

  function announceForScreenReaders(message: React.ReactNode) {
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

    // For a correct submission, clear out previous incorrect submissions
    let incorrectSubmissions: [string, Cca3Code][][] = [];

    // Submission is correct if all matched (non-blank) values are correct
    for (const [index, countryCode] of Object.entries(quizState.matchedCountryCodes)) {
      const matchedValue = sortedMatchValues[parseInt(index)].value;

      if (!matchedValue || !countryCode) {
        continue;
      }

      const correctValue = quizState.quiz.valueFunction(storedCountryData, countryCode);

      if (correctValue !== matchedValue) {
        submissionCorrect = false;
        break;
      }
    }

    const newMatchedCountryCodes = {...quizState.matchedCountryCodes};
    let newLockedInCountryCodes = [...quizState.countryCodesLockedInAsCorrect];

    const submissionsRemaining = quizState.submissionsRemaining - 1;
    const screenReaderMessageParts: React.ReactNode[] = [];

    if (!submissionCorrect) {
      // Record the incorrect submission
      incorrectSubmissions = [...quizState.incorrectSubmissions,
          Object.entries(newMatchedCountryCodes) as [string, Cca3Code][]];

      // Clear out any non-locked-in countries
      for (const [index, countryCode] of Object.entries(quizState.matchedCountryCodes)) {
        if (!countryCode || !quizState.countryCodesLockedInAsCorrect.includes(countryCode)) {
          delete newMatchedCountryCodes[parseInt(index)];
        }
      }

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
      newLockedInCountryCodes = Object.values(newMatchedCountryCodes) as Cca3Code[];
    }

    screenReaderMessageParts.push(` ${submissionsRemaining} submission${
          submissionsRemaining === 1 ? "" : "s"} remaining.`);

    if (quizState.countryCodes.length === newLockedInCountryCodes.length) {
      screenReaderMessageParts.push(" All countries correctly matched. Ready for the next round.");
    } else if (submissionsRemaining <= 0) {
      screenReaderMessageParts.push(` The quiz has ended on round ${quizState.round}.`);
    }

    announceForScreenReaders(<>{screenReaderMessageParts}</>);

    setQuizState({
      ...quizState,
      matchedCountryCodes: newMatchedCountryCodes,
      countryCodesLockedInAsCorrect: newLockedInCountryCodes,
      submissionsRemaining,
      incorrectSubmissions,
    });
  }

  function onRemove(countryCode: Cca3Code) {
    const index = Object.keys(quizState.matchedCountryCodes).find(indexStr =>
        quizState.matchedCountryCodes[parseInt(indexStr)] === countryCode);

    if (index) {
      const parsedIndex = parseInt(index);
      const matchedData = sortedMatchValues[parsedIndex];

      const newMatchedCountryCodes = {...quizState.matchedCountryCodes};
      delete newMatchedCountryCodes[parsedIndex];
      setMatchedCountryCodes(newMatchedCountryCodes);

      // Use the original label to avoid using the markup for flags
      announceForScreenReaders(<>{storedCountryData.countries[countryCode]?.data?.name ?? countryCode
          } unmatched from {quizState.quiz.labelFunction(storedCountryData, matchedData.cca3)}.</>);
    }
  }

  // Add to the slot at the designated index if provided,
  // or else to the first empty one.  If the provided index
  // is occupied and not locked-in, swap with the country code there.
  // If it is locked-in, do nothing. Also handles if dragged from another index.
  function onAdd(countryCode: Cca3Code, index = -1) {
    const countryCodeAtSlot = quizState.matchedCountryCodes[index];

    if (countryCodeAtSlot && quizState.countryCodesLockedInAsCorrect.includes(countryCodeAtSlot)) {
      return;
    }

    if (index < 0) {
      // No designated slot, so find the first empty slot
      for (let i = 0; i < sortedMatchValues.length; i++) {
        if (!quizState.matchedCountryCodes[i]) {
          index = i;
          break;
        }
      }
    }

    const currentCountryCodeIndex = Object.keys(quizState.matchedCountryCodes).find(indexStr =>
        quizState.matchedCountryCodes[parseInt(indexStr)] === countryCode);

    if (index >= 0 && String(index) !== currentCountryCodeIndex) {
      const newMatchedCountryCodes = {...quizState.matchedCountryCodes};

      if (currentCountryCodeIndex) {
        if (countryCodeAtSlot) {
          newMatchedCountryCodes[parseInt(currentCountryCodeIndex)] = countryCodeAtSlot;
        } else {
          delete newMatchedCountryCodes[parseInt(currentCountryCodeIndex)];
        }
      }

      newMatchedCountryCodes[index] = countryCode;
      setMatchedCountryCodes(newMatchedCountryCodes);

      // Use the original label to avoid using the markup for flags
      announceForScreenReaders(<>{storedCountryData.countries[countryCode]?.data?.name ?? countryCode
          } now matched to {
            quizState.quiz.labelFunction(storedCountryData, sortedMatchValues[index].cca3)
          }{countryCodeAtSlot ? `, swapped with ${
            storedCountryData.countries[countryCodeAtSlot]?.data?.name ?? countryCodeAtSlot
          }` : ""}.</>);
    }
  }

  // Move to previous non-locked-in index in the sortedMatchValues order,
  // looping around if the first one, and swapping with the country code there, if any
  function onMoveUp(countryCode: Cca3Code) {
    const matchValueIndex = Object.keys(quizState.matchedCountryCodes).find(indexStr =>
        quizState.matchedCountryCodes[parseInt(indexStr)] === countryCode);

    if (!matchValueIndex) {
      return;
    }

    const parsedMatchValueIndex = parseInt(matchValueIndex);

    if (!quizState.matchedCountryCodes[parsedMatchValueIndex]) {
      return;
    }

    let newMatchValueIndex = -1;
    let countryCodeAtSlot: Cca3Code | undefined;

    for (let i = parsedMatchValueIndex - 1; i !== parsedMatchValueIndex; i--) {
      if (i < 0) {
        i = sortedMatchValues.length;
        continue;
      }

      countryCodeAtSlot = quizState.matchedCountryCodes[i];

      if (countryCodeAtSlot
          && quizState.countryCodesLockedInAsCorrect.includes(countryCodeAtSlot)) {
        continue;
      }

      newMatchValueIndex = i;
      break;
    }

    if (newMatchValueIndex < 0) {
      announceForScreenReaders("No available slots to move to.");
      return;
    }

    const newMatchedCountryCodes = {...quizState.matchedCountryCodes};

    if (countryCodeAtSlot) {
      newMatchedCountryCodes[parsedMatchValueIndex] = countryCodeAtSlot;
    } else {
      delete newMatchedCountryCodes[parsedMatchValueIndex];
    }

    newMatchedCountryCodes[newMatchValueIndex] = countryCode;
    setMatchedCountryCodes(newMatchedCountryCodes);

    setTimeout(() => {
      // Maintain focus on the button for the value element after moving
      const moveUpButton = document.querySelector(`.draggable-country-pool.target-container li:nth-child(${
        newMatchValueIndex + 1
      }) .move-up-button`);

      if (moveUpButton instanceof HTMLElement) {
        moveUpButton.focus();
      }
    });

    // Use the original label to avoid using the markup for flags
    announceForScreenReaders(<>{storedCountryData.countries[countryCode]?.data?.name ?? countryCode
        } moved up, now matched to {quizState.quiz.labelFunction(
            storedCountryData, sortedMatchValues[newMatchValueIndex].cca3)}{
        countryCodeAtSlot ? `, swapped with ${
          storedCountryData.countries[countryCodeAtSlot]?.data?.name ?? countryCodeAtSlot
        }.` : ""}</>);
  }

  // Move to next non-locked-in index in the sortedMatchValues order,
  // looping around if the last one, and swapping with the country code there, if any
  function onMoveDown(countryCode: Cca3Code) {
    const matchValueIndex = Object.keys(quizState.matchedCountryCodes).find(indexStr =>
        quizState.matchedCountryCodes[parseInt(indexStr)] === countryCode);

    if (!matchValueIndex) {
      return;
    }

    const parsedMatchValueIndex = parseInt(matchValueIndex);

    if (!quizState.matchedCountryCodes[parsedMatchValueIndex]) {
      return;
    }

    let newMatchValueIndex = -1;
    let countryCodeAtSlot: Cca3Code | undefined;

    for (let i = parsedMatchValueIndex + 1; i !== parsedMatchValueIndex; i++) {
      if (i >= sortedMatchValues.length) {
        i = -1;
        continue;
      }

      countryCodeAtSlot = quizState.matchedCountryCodes[i];

      if (countryCodeAtSlot
          && quizState.countryCodesLockedInAsCorrect.includes(countryCodeAtSlot)) {
        continue;
      }

      newMatchValueIndex = i;
      break;
    }

    if (newMatchValueIndex < 0) {
      announceForScreenReaders("No available slots to move to.");
      return;
    }

    const newMatchedCountryCodes = {...quizState.matchedCountryCodes};

    if (countryCodeAtSlot) {
      newMatchedCountryCodes[parsedMatchValueIndex] = countryCodeAtSlot;
    } else {
      delete newMatchedCountryCodes[parsedMatchValueIndex];
    }

    newMatchedCountryCodes[newMatchValueIndex] = countryCode;
    setMatchedCountryCodes(newMatchedCountryCodes);

    setTimeout(() => {
      // Maintain focus on the button for the value element after moving
      const moveDownButton = document.querySelector(`.draggable-country-pool.target-container li:nth-child(${
        newMatchValueIndex + 1
      }) .move-down-button`);

      if (moveDownButton instanceof HTMLButtonElement) {
        moveDownButton.focus();
      }
    });

    // Use the original label to avoid using the markup for flags
    announceForScreenReaders(<>{storedCountryData.countries[countryCode]?.data?.name ?? countryCode
        } moved down, now matched to {quizState.quiz.labelFunction(
            storedCountryData, sortedMatchValues[newMatchValueIndex].cca3)}{
        countryCodeAtSlot ? `, swapped with ${
          storedCountryData.countries[countryCodeAtSlot]?.data?.name ?? countryCodeAtSlot
        }.` : ""}</>);
  }

  return (
    (quizState.quiz.structure !== "matching") ? null : <>
      <p className="sr-only" aria-live="polite">{srAnnouncement}</p>

      <div className="quiz-controls">
        <DraggableCountryPool headerId="unmatched-pool-header"
            headerText="Unmatched Countries"
            emptyMessage="All countries have been matched"
            selectedCountryCode={selectedCountryCode}
            onDrop={handleDropForUnmatchedPool}>
          {unmatchedCountryCodes.map((countryCode) => (
            <li key={countryCode}>
              <DraggableCountry cca3={countryCode}
                  revealedValueLabel={sortedMatchValues.find(matchData => matchData.cca3 === countryCode)?.label}
                  isSelected={countryCode === selectedCountryCode}
                  isDragged={countryCode === selectedCountryCode && isDraggingCountryCode}
                  roundActive={quizState.submissionsRemaining > 0
                      && quizState.countryCodesLockedInAsCorrect.length < quizState.countryCodes.length}
                  quizActive={quizState.submissionsRemaining > 0
                      || quizState.countryCodesLockedInAsCorrect.length >= quizState.countryCodes.length}
                  quizTypeKey={quizState.quiz.type}
                  onDragStart={(event) => handleDragStart(event, countryCode)}
                  onDragEnd={handleDragEnd}
                  onDrag={handleDrag}
                  onDrop={handleDropForUnmatchedPool}
                  onAdd={() => onAdd(countryCode)} />
            </li>
          ))}
        </DraggableCountryPool>

        <DraggableCountryPool headerId="matched-pool-header"
            headerText={`Country ${quizState.quiz.matchTypeLabel} to Match to`}
            canBeDroppedIntoDirectly={false}
            isTargetContainer
            emptyMessage="Error">
          {sortedMatchValues.map((matchData, index) => {
            const countryCodeMatchValueIsMatchedTo = quizState.matchedCountryCodes[index];
            const itemKey = `${getReactNodeString(matchData.label)}_${index}`;

            // Could use the country code as the key when available, so that focus
            // automatically remains on the country component's buttons when moved up/down,
            // but the key needs to be based on the slot in order to preserve image loading
            // and details collapse states, so need to handle focus manually...
            return (
              <li key={itemKey}>
                <DraggableCountryPool headerId="matched-pool-header"
                    headerText={matchData.label}
                    headerLevel={quizState.quiz.type === "MATCH_TO_FLAGS"
                        || quizState.quiz.type === "MATCH_TO_LOCATIONS" ? 0 : 3}
                    singleCapacity
                    canBeDroppedIntoDirectly={!countryCodeMatchValueIsMatchedTo
                        || !quizState.countryCodesLockedInAsCorrect.includes(countryCodeMatchValueIsMatchedTo)}
                    emptyMessage="Drag the matching country here"
                    selectedCountryCode={selectedCountryCode}
                    onDrop={event => handleDropForMatchValue(event, index)}>
                  {countryCodeMatchValueIsMatchedTo ? (
                    <DraggableCountry cca3={countryCodeMatchValueIsMatchedTo}
                      isSelected={countryCodeMatchValueIsMatchedTo === selectedCountryCode}
                      isDragged={countryCodeMatchValueIsMatchedTo === selectedCountryCode
                          && isDraggingCountryCode}
                      isLockedIn={quizState.countryCodesLockedInAsCorrect
                          .includes(countryCodeMatchValueIsMatchedTo)}
                      roundActive={quizState.submissionsRemaining > 0
                          && quizState.countryCodesLockedInAsCorrect.length < quizState.countryCodes.length}
                      quizActive={quizState.submissionsRemaining > 0
                          || quizState.countryCodesLockedInAsCorrect.length >= quizState.countryCodes.length}
                      quizTypeKey={quizState.quiz.type}
                      onDragStart={(event) => handleDragStart(event, countryCodeMatchValueIsMatchedTo)}
                      onDragEnd={handleDragEnd}
                      onDrag={handleDrag}
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

      {quizState.countryCodesLockedInAsCorrect.length < quizState.countryCodes.length && <QuizSubmitButton
          onSubmit={attemptSubmit}
          alreadyGuessed={alreadyGuessed}
          disabled={Object.keys(quizState.matchedCountryCodes).length <=
              quizState.countryCodesLockedInAsCorrect.length}
          submissionsRemaining={quizState.submissionsRemaining} />}
    </>
  );
}

export default QuizControlsForMatching;
