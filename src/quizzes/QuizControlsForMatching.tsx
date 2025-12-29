import type { Cca3Code } from "@yusifaliyevpro/countries/types";
import React, { useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import { Link } from "react-router-dom";
import CaptionedImageDialogButton from "../CaptionedImageDialogButton";
import type { CountryStorage } from "../CountriesProvider";
import CountryLinksValue from "../CountryLinksValue";
import useCountries from "../hooks/useCountries";
import { CUSTOM_DRAG_TYPE, QUIZ_MAX_LEVEL, QUIZ_ONE_GO_TIP, QUIZ_ROUNDS_PER_LEVEL } from "../utils/consts";
import { getCountryNameFromCode, sortCountryCodesByName } from "../utils/countryUtils";
import { callFunctionWithViewTransition, getLocatorMapSrc, getReactNodeString } from "../utils/utils";
import CountryFieldDisplayValue from "./CountryFieldDisplayValue";
import DraggableCountry from "./DraggableCountry";
import DraggableCountryPool from "./DraggableCountryPool";
import QuizSubmitButton from "./QuizSubmitButton";
import type { CountryCodeOverrideData, MatchingQuizState, QuizState } from "./quizConfig";
import { doCountryCodeOverridesMatch, isQuizActive } from "./quizUtils";

function getSortedMatchedCountryCodes(storedCountryData: CountryStorage,
    matchedCountryCodes: Partial<Record<number, CountryCodeOverrideData[]>>) {
  const matchedCodes = structuredClone(matchedCountryCodes);

  // Sort alphabetically by country name
  for (const cca3Array of Object.values(matchedCodes)) {
    if (cca3Array?.length) {
      cca3Array.sort((a, b) => {
        return getCountryNameFromCode(a.cca3, storedCountryData.countries)
            .localeCompare(getCountryNameFromCode(b.cca3, storedCountryData.countries)) ?? 0;
      });
    }
  }

  return matchedCodes;
}

interface QuizControlsForMatchingProps {
  quizState: MatchingQuizState;
  setQuizState: (quizState: QuizState) => void;
}

function QuizControlsForMatching({quizState, setQuizState}: QuizControlsForMatchingProps) {
  const [selectedCountryCode, setSelectedCountryCode] =
      useState<CountryCodeOverrideData | null>(null);
  const [selectedCountryCodeMatchIndex, setSelectedCountryCodeMatchIndex] =
      useState<number>(-1);
  const [isDraggingCountryCode, setIsDraggingCountryCode] = useState(false);
  const dragTestTimeoutIdRef = useRef<NodeJS.Timeout | number>(0);

  const [targetMatchIndexForAdd, setTargetMatchIndexForAdd] = useState<number>(-1);

  // Announcement for screen readers
  const [srAnnouncement, setSrAnnouncement] = useState<React.ReactNode>('');
  const srAnnouncementTimeoutIdRef = useRef<NodeJS.Timeout | number>(0);

  const { storedCountryData } = useCountries();

  const singleCapacity = quizState.quiz.singleCapacity;

  const quizCountryCodes: CountryCodeOverrideData[] = useMemo(() => {
    return quizState.countryCodesOverride ??
        quizState.countryCodes.map(countryCode => ({
          originatingCca3: countryCode,
          cca3: countryCode,
          secondaryIndex: 0,
        }));
  }, [quizState.countryCodesOverride, quizState.countryCodes]);

  const numberOfLockedInCountryCodes = useMemo(() => {
    return Object.values(quizState.countryCodesLockedInAsCorrect).flat().length;
  }, [quizState.countryCodesLockedInAsCorrect]);

  const quizActive = isQuizActive(quizState);
  const roundActive = quizActive && quizState.submissionsRemaining > 0
      && numberOfLockedInCountryCodes < quizCountryCodes.length;

  function setMatchedCountryCodes(matchedCountryCodes: Partial<Record<number, CountryCodeOverrideData[]>>) {
    setQuizState({
      ...quizState,
      matchedCountryCodes,
    });
  }

  useEffect(() => {
    // Reset state when the country codes change for a new round
    handleDragEnd();

    return () => {
      clearTimeout(srAnnouncementTimeoutIdRef.current);
      clearTimeout(dragTestTimeoutIdRef.current);
    };
  }, [quizState.countryCodes]);

  const allValuesAreIdentical = useMemo(() => {
    return quizCountryCodes.every(({cca3: countryCode}) => {
      return quizState.quiz.valueFunction(storedCountryData, countryCode)
          === quizState.quiz.valueFunction(storedCountryData, quizState.countryCodes[0])
    });
  }, [quizCountryCodes, quizState.quiz, quizState.countryCodes, storedCountryData]);

  const sortedMatchValues = useMemo(() => {
    // Map on quizState.countryCodes, because countries without bordering countries
    // aren't represented in the countryCodesOverride, and will have duplicates
    // for countries with multiple bordering countries
    const matchValues: {cca3: Cca3Code, valueArray: string[] | undefined,
        secondaryIndex: number | undefined, value: string,
        label: React.ReactNode}[] = quizState.countryCodes.map(countryCode => {
      const countryCodeData = quizCountryCodes.find(countryCodeData =>
          countryCodeData.originatingCca3 === countryCode) ?? {
            originatingCca3: countryCode,
            cca3: countryCode,
            secondaryIndex: 0,
          };
      const valueArray = quizState.quiz.valueArrayFunction ?
          quizState.quiz.valueArrayFunction(storedCountryData, countryCodeData.originatingCca3) : undefined;
      const secondaryIndex = countryCodeData.secondaryIndex;
      const value = quizState.quiz.valueFunction(storedCountryData,
          countryCodeData.originatingCca3, secondaryIndex);
      let label = quizState.quiz.labelFunction(storedCountryData,
          countryCodeData.originatingCca3, secondaryIndex);

      if (quizState.quiz.type === "MATCH_TO_FLAGS") {
        label = <CountryFieldDisplayValue cca3={countryCodeData.originatingCca3} field="flagDescription" />
      } else if (quizState.quiz.type === "MATCH_TO_LOCATIONS") {
        label = <CountryFieldDisplayValue cca3={countryCodeData.originatingCca3} field="location" />
      }

      return {
        cca3: countryCodeData.originatingCca3,
        valueArray,
        secondaryIndex,
        value,
        label,
      };
    });

    if (quizState.quiz.type === "MATCH_TO_BORDERING_COUNTRIES") {
      // Sort alphabetically by country name
      matchValues.sort((a, b) => {
        return getCountryNameFromCode(a.cca3, storedCountryData.countries)
            .localeCompare(getCountryNameFromCode(b.cca3, storedCountryData.countries)) ?? 0;
      });
    } else {
      // Sort alphabetically by value (avoiding markup parsing with the label)
      matchValues.sort((a, b) => {
        return a.value.localeCompare(b.value);
      });
    }

    return matchValues;
  }, [storedCountryData, quizCountryCodes, quizState.quiz, quizState.countryCodes]);

  const unmatchedCountryCodes = useMemo(() => {
    const matchedCodes = Object.values(quizState.matchedCountryCodes).flat()
        .filter(Boolean) as CountryCodeOverrideData[];
    const unmatchedCodes = quizCountryCodes.filter(countryCodeData => {
      return !matchedCodes.some(matchedCountryCode =>
          doCountryCodeOverridesMatch(matchedCountryCode, countryCodeData));
    });

    unmatchedCodes.sort((a, b) => getCountryNameFromCode(a.cca3, storedCountryData.countries)
        ?.localeCompare(getCountryNameFromCode(b.cca3, storedCountryData.countries)));
    return unmatchedCodes;
  }, [quizState.matchedCountryCodes, quizCountryCodes, storedCountryData.countries]);

  const sortedMatchedCountryCodes = useMemo(() => {
    return getSortedMatchedCountryCodes(storedCountryData, quizState.matchedCountryCodes);
  }, [storedCountryData, quizState.matchedCountryCodes]);

  const alreadyGuessed = useMemo(() => {
    for (const incorrectSubmission of quizState.incorrectSubmissions) {
      if (JSON.stringify(incorrectSubmission) ===
          JSON.stringify(Object.entries(sortedMatchedCountryCodes))) {
        return true;
      }
    };

    return false;
  }, [sortedMatchedCountryCodes, quizState.incorrectSubmissions]);

  useEffect(() => {
    // Stop targeting for add when single-capacity slot is filled
    if (singleCapacity && quizState.matchedCountryCodes[targetMatchIndexForAdd]?.length) {
      setTargetMatchIndexForAdd(-1);
    }
  }, [quizState.matchedCountryCodes, singleCapacity, targetMatchIndexForAdd]);

  function announceForScreenReaders(message: React.ReactNode) {
    clearTimeout(srAnnouncementTimeoutIdRef.current);
    setSrAnnouncement(message);

    // Clear the message after a delay so that it doesn't remain
    // navigable by screen readers in browse mode
    srAnnouncementTimeoutIdRef.current = setTimeout(() => setSrAnnouncement(''), 1000);
  }

  function handleDragStart(event: DragEvent, countryCodeData: CountryCodeOverrideData,
      matchIndex = -1) {
    if (event.dataTransfer.types.length) {
      // Deselect any selected text
      window.getSelection()?.removeAllRanges();

      // Trying to salvage the current drag doesn't tend to work, so just cancel it
      event.preventDefault();
      return;
    }

    // Use a custom data type to prevent interactions with dragged text or the like
    event.dataTransfer.setData(CUSTOM_DRAG_TYPE, countryCodeData.cca3);
    event.dataTransfer.effectAllowed = 'move';

    setSelectedCountryCode(countryCodeData);
    setSelectedCountryCodeMatchIndex(matchIndex);
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

    if (targetMatchIndexForAdd !== -1) {
      setTargetMatchIndexForAdd(-1);
    }
  }

  function handleDragEnd() {
    // Note that this won't get triggered if the dragged element
    // is unmounted in the drop handler, so drop handlers that
    // move elements need to clear the selection themselves
    setSelectedCountryCode(null);
    setSelectedCountryCodeMatchIndex(-1);
    setIsDraggingCountryCode(false);
  }

  function handleDropForMatchValue(event: DragEvent, matchIndex: number) {
    if (selectedCountryCode
        && event.dataTransfer.types.every(type => type === CUSTOM_DRAG_TYPE)) {
      event.preventDefault();
      event.stopPropagation();
      onAdd(selectedCountryCode, matchIndex);
      handleDragEnd();
    }
  }

  function handleDropForUnmatchedPool(event: DragEvent) {
    if (selectedCountryCode
        && event.dataTransfer.types.every(type => type === CUSTOM_DRAG_TYPE)) {
      event.preventDefault();
      event.stopPropagation();
      onRemove(selectedCountryCode, selectedCountryCodeMatchIndex);
      handleDragEnd();
    }
  }

  function attemptSubmit() {
    setTargetMatchIndexForAdd(-1);

    let submissionCorrect = true;

    // For a correct submission, clear out previous incorrect submissions
    let incorrectSubmissions: [string, CountryCodeOverrideData[]][][] = [];

    // Submission is correct if all matched (non-blank) values are correct
    for (const [index, countryCodes] of Object.entries(sortedMatchedCountryCodes)) {
      const {value: matchedValue, valueArray: matchedValueArray, secondaryIndex} =
          sortedMatchValues[parseInt(index)];

      if (!matchedValue || !countryCodes?.length) {
        continue;
      }

      for (const countryCodeData of countryCodes) {
        // Only bordering countries quizzes actually use the value array for validation
        if (quizState.quiz.type === "MATCH_TO_BORDERING_COUNTRIES") {
          if (matchedValueArray && !matchedValueArray.includes(countryCodeData.cca3)) {
            submissionCorrect = false;
            break;
          }
        } else {
          const correctValue = quizState.quiz.valueFunction(
              storedCountryData, countryCodeData.cca3, secondaryIndex);

          if (correctValue !== matchedValue) {
            submissionCorrect = false;
            break;
          }
        }
      }
    }

    const newMatchedCountryCodes = structuredClone(sortedMatchedCountryCodes);
    let newLockedInCountryCodes = structuredClone(quizState.countryCodesLockedInAsCorrect);

    const submissionsRemaining = quizState.submissionsRemaining - 1;
    const screenReaderMessageParts: React.ReactNode[] = [];

    if (!submissionCorrect) {
      // Record the incorrect submission
      incorrectSubmissions = [...quizState.incorrectSubmissions,
          Object.entries(newMatchedCountryCodes) as [string, CountryCodeOverrideData[]][]];

      // Clear out any non-locked-in countries
      for (const [index, countryCodes] of Object.entries(sortedMatchedCountryCodes)) {
        if (countryCodes?.length) {
          newMatchedCountryCodes[parseInt(index)] = countryCodes.filter(countryCode =>
              newLockedInCountryCodes[parseInt(index)]?.find(lockedInCountryCode =>
                  doCountryCodeOverridesMatch(countryCode, lockedInCountryCode)));
        }

        if (!countryCodes?.length) {
          delete newMatchedCountryCodes[parseInt(index)];
        }
      }

      // Briefly animate the matched list shaking
      const matchedListElement = document.querySelector('.draggable-country-pool.target-container');

      if (matchedListElement) {
        matchedListElement.classList.add('shake');
        setTimeout(() => matchedListElement.classList.remove('shake'), 500);
      }

      // Sound effect..

      screenReaderMessageParts.push("Submission incorrect.");
    } else {
      screenReaderMessageParts.push("Submission correct and locked-in.");
      newLockedInCountryCodes = structuredClone(newMatchedCountryCodes);
    }

    screenReaderMessageParts.push(` ${submissionsRemaining} submission${
          submissionsRemaining === 1 ? "" : "s"} remaining.`);

    if (quizCountryCodes.length === Object.values(newLockedInCountryCodes).flat().length) {
      if (quizState.level >= QUIZ_MAX_LEVEL && quizState.round >= QUIZ_ROUNDS_PER_LEVEL) {
        screenReaderMessageParts.push(" All countries correctly matched. You beat the quiz!");
      } else {
        screenReaderMessageParts.push(" All countries correctly matched. Ready for the next round.");
      }
    } else if (submissionsRemaining <= 0) {
      screenReaderMessageParts.push(` The quiz has ended on level ${quizState.level}, round ${quizState.round}.`);
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

  function canSlotAcceptCountryCode(countryCode: Cca3Code, matchIndex: number, allowSwaps = true) {
    const countryCodesAtSlot = sortedMatchedCountryCodes[matchIndex];

    if (countryCodesAtSlot?.length) {
      if (countryCodesAtSlot.find(slotData => slotData.cca3 === countryCode)) {
        // Occupied by the same country already
        return false;
      }

      if (singleCapacity) {
        if (allowSwaps) {
          if (quizState.countryCodesLockedInAsCorrect[matchIndex]
              ?.find(lockedInCountryCode => doCountryCodeOverridesMatch(
                  lockedInCountryCode, countryCodesAtSlot[0]))) {
            // Occupied by a locked-in country
            return false;
          }
        } else {
          // Occupied by a country
          return false;
        }
      }
    }

    return true;
  }

  // Remove the country code from the slot at the designated index
  function onRemove(countryCodeData: CountryCodeOverrideData, matchIndex: number) {
    const matchCountryCodes = sortedMatchedCountryCodes[matchIndex];

    if (!matchCountryCodes?.length) {
      return;
    }

    const matchedData = sortedMatchValues[matchIndex];

    const newMatchedCountryCodes = structuredClone(sortedMatchedCountryCodes);
    const newCountryCodes = matchCountryCodes.filter(countryCodeValue =>
        countryCodeValue.cca3 !== countryCodeData.cca3
            || countryCodeValue.originatingCca3 !== countryCodeData.originatingCca3);

    if (newCountryCodes.length) {
      newMatchedCountryCodes[matchIndex] = newCountryCodes;
    } else {
      delete newMatchedCountryCodes[matchIndex];
    }

    callFunctionWithViewTransition(() => {
      setMatchedCountryCodes(newMatchedCountryCodes);

      // Use the original label to avoid using the markup for flags
      announceForScreenReaders(<>{getCountryNameFromCode(countryCodeData.cca3, storedCountryData.countries)
          } unmatched from {quizState.quiz.labelFunction(storedCountryData, matchedData.cca3)}.</>);
    }, isDraggingCountryCode);
  }

  // Add to the slot at the designated index if set,
  // or else to the first one with capacity.  If single capacity and the provided index
  // is occupied and not locked-in, swap with the country code there.
  // If it is locked-in, do nothing. Also handles if dragged from another index.
  function onAdd(countryCodeData: CountryCodeOverrideData, matchIndex = targetMatchIndexForAdd) {
    if (matchIndex >= 0 && !canSlotAcceptCountryCode(countryCodeData.cca3, matchIndex)) {
      return;
    }

    if (matchIndex < 0) {
      // No designated slot, so find the first available slot
      for (let i = 0; i < sortedMatchValues.length; i++) {
        if (canSlotAcceptCountryCode(countryCodeData.cca3, i, false)) {
          matchIndex = i;
          break;
        }
      }
    }

    let countryCodesAtSlot = sortedMatchedCountryCodes[matchIndex];

    if (matchIndex >= 0 && matchIndex !== selectedCountryCodeMatchIndex) {
      const newMatchedCountryCodes = structuredClone(sortedMatchedCountryCodes);

      if (selectedCountryCodeMatchIndex >= 0) {
        const newCountryCodes = [...(sortedMatchedCountryCodes[selectedCountryCodeMatchIndex] ?? [])]
            .filter((slotCountryCodeData) => slotCountryCodeData.cca3 !== countryCodeData.cca3
                || slotCountryCodeData.originatingCca3 !== countryCodeData.originatingCca3);

        if (singleCapacity && countryCodesAtSlot?.length) {
          // Add the occupying country to the moving country's slot
          newCountryCodes.push(countryCodesAtSlot[0]);
          newMatchedCountryCodes[selectedCountryCodeMatchIndex] = newCountryCodes;

          // Remove the occupying country from its original slot
          countryCodesAtSlot = [];
        } else {
          // Remove the selected country
          if (newCountryCodes.length) {
            newMatchedCountryCodes[selectedCountryCodeMatchIndex] = newCountryCodes;
          } else {
            delete newMatchedCountryCodes[selectedCountryCodeMatchIndex];
          }
        }
      } else if (singleCapacity && countryCodesAtSlot?.length) {
        // Remove the occupying country from its original slot
          countryCodesAtSlot = [];
      }

      // Add the country to its new slot
      const newCountryCodes = (countryCodesAtSlot ?? []);
      newCountryCodes.push(countryCodeData);
      newMatchedCountryCodes[matchIndex] = newCountryCodes;

      callFunctionWithViewTransition(() => {
        setMatchedCountryCodes(newMatchedCountryCodes);

        // Use the original label to avoid using the markup for flags
        announceForScreenReaders(<>{getCountryNameFromCode(countryCodeData.cca3, storedCountryData.countries)
            } now matched to {
              quizState.quiz.labelFunction(storedCountryData, sortedMatchValues[matchIndex].cca3)
            }{singleCapacity && countryCodesAtSlot?.length ? `, swapped with ${
              getCountryNameFromCode(countryCodesAtSlot[0].cca3, storedCountryData.countries)
            }` : ""}.</>);
      }, isDraggingCountryCode);
    }
  }

  // Move to previous index with capacity in the sortedMatchValues order,
  // looping around if the first one, and swapping with any country code there if single capacity
  function onMoveUp(countryCodeData: CountryCodeOverrideData, matchIndex: number) {
    const matchCountryCodes = sortedMatchedCountryCodes[matchIndex];

    if (!matchCountryCodes?.length) {
      return;
    }

    let newMatchValueIndex = -1;
    let countryCodesAtSlot: CountryCodeOverrideData[] | undefined;

    for (let i = matchIndex - 1; i !== matchIndex; i--) {
      if (i < 0) {
        i = sortedMatchValues.length;
        continue;
      }

      if (!canSlotAcceptCountryCode(countryCodeData.cca3, i)) {
        continue;
      }

      countryCodesAtSlot = sortedMatchedCountryCodes[i] ?? [];

      newMatchValueIndex = i;
      break;
    }

    if (newMatchValueIndex < 0 || !countryCodesAtSlot) {
      announceForScreenReaders("No available slots to move to.");
      return;
    }

    const newMatchedCountryCodes = structuredClone(sortedMatchedCountryCodes);

    const newCountryCodes = [...(newMatchedCountryCodes[matchIndex] ?? [])]
        .filter((slotCountryCodeData) => slotCountryCodeData.cca3 !== countryCodeData.cca3
            || slotCountryCodeData.originatingCca3 !== countryCodeData.originatingCca3);

    if (singleCapacity && countryCodesAtSlot.length) {
      // Add the occupying country to the moving country's slot
      newCountryCodes.push(countryCodesAtSlot[0]);
      newMatchedCountryCodes[matchIndex] = newCountryCodes;

      // Remove the occupying country from its original slot
      countryCodesAtSlot = [];
    } else {
      // Remove the moving country from its slot
      if (newCountryCodes.length) {
        newMatchedCountryCodes[matchIndex] = newCountryCodes;
      } else {
        delete newMatchedCountryCodes[matchIndex];
      }
    }

    // Add the moving country to the new slot
    newMatchedCountryCodes[newMatchValueIndex] = [...countryCodesAtSlot, countryCodeData];

    callFunctionWithViewTransition(() => {
      setMatchedCountryCodes(newMatchedCountryCodes);

      requestAnimationFrame(() => {
        const sortedMatched = getSortedMatchedCountryCodes(storedCountryData, newMatchedCountryCodes);
        const arrayIndex = sortedMatched[newMatchValueIndex]?.findIndex(countryCode =>
            doCountryCodeOverridesMatch(countryCode, countryCodesAtSlot[0])) ?? -1;

        if (arrayIndex >= 0) {
          // Maintain focus on the button for the value element after moving
          const moveUpButton = document.querySelectorAll(`.draggable-country-pool.target-container > ul > li:nth-child(${
            newMatchValueIndex + 1
          }) .move-up-button`)[arrayIndex];

          if (moveUpButton instanceof HTMLButtonElement) {
            moveUpButton.focus();
          }
        }
      });

      // Use the original label to avoid using the markup for flags
      announceForScreenReaders(<>{getCountryNameFromCode(countryCodeData.cca3, storedCountryData.countries)
          } moved up, now matched to {quizState.quiz.labelFunction(
              storedCountryData, sortedMatchValues[newMatchValueIndex].cca3)}{
          singleCapacity && countryCodesAtSlot.length ? `, swapped with ${
            getCountryNameFromCode(countryCodesAtSlot[0].cca3, storedCountryData.countries)
          }.` : ""}</>);
    });
  }

  // Move to next index with capacity in the sortedMatchValues order,
  // looping around if the last one, and swapping with any country code there if single capacity
  function onMoveDown(countryCodeData: CountryCodeOverrideData, matchIndex: number) {
    const matchCountryCodes = sortedMatchedCountryCodes[matchIndex];

    if (!matchCountryCodes?.length) {
      return;
    }

    let newMatchValueIndex = -1;
    let countryCodesAtSlot: CountryCodeOverrideData[] | undefined;

    for (let i = matchIndex + 1; i !== matchIndex; i++) {
      if (i >= sortedMatchValues.length) {
        i = -1;
        continue;
      }

      if (!canSlotAcceptCountryCode(countryCodeData.cca3, i)) {
        continue;
      }

      countryCodesAtSlot = sortedMatchedCountryCodes[i] ?? [];

      newMatchValueIndex = i;
      break;
    }

    if (newMatchValueIndex < 0 || !countryCodesAtSlot) {
      announceForScreenReaders("No available slots to move to.");
      return;
    }

    const newMatchedCountryCodes = structuredClone(sortedMatchedCountryCodes);

    const newCountryCodes = [...(newMatchedCountryCodes[matchIndex] ?? [])]
        .filter((slotCountryCodeData) => slotCountryCodeData.cca3 !== countryCodeData.cca3
            || slotCountryCodeData.originatingCca3 !== countryCodeData.originatingCca3);

    if (singleCapacity && countryCodesAtSlot.length) {
      // Add the occupying country to the moving country's slot
      newCountryCodes.push(countryCodesAtSlot[0]);
      newMatchedCountryCodes[matchIndex] = newCountryCodes;

      // Remove the occupying country from its original slot
      countryCodesAtSlot = [];
    } else {
      // Remove the moving country from its slot
      if (newCountryCodes.length) {
        newMatchedCountryCodes[matchIndex] = newCountryCodes;
      } else {
        delete newMatchedCountryCodes[matchIndex];
      }
    }

    // Add the moving country to the new slot
    newMatchedCountryCodes[newMatchValueIndex] = [...countryCodesAtSlot, countryCodeData];

    callFunctionWithViewTransition(() => {
      setMatchedCountryCodes(newMatchedCountryCodes);

      requestAnimationFrame(() => {
        const sortedMatched = getSortedMatchedCountryCodes(storedCountryData, newMatchedCountryCodes);
        const arrayIndex = sortedMatched[newMatchValueIndex]?.findIndex(countryCodeData =>
            doCountryCodeOverridesMatch(countryCodeData, countryCodeData)) ?? -1;

        if (arrayIndex >= 0) {
          // Maintain focus on the button for the value element after moving
          const moveDownButton = document.querySelectorAll(`.draggable-country-pool.target-container > ul > li:nth-child(${
            newMatchValueIndex + 1
          }) .move-down-button`)[arrayIndex];

          if (moveDownButton instanceof HTMLButtonElement) {
            moveDownButton.focus();
          }
        }
      });

      // Use the original label to avoid using the markup for flags
      announceForScreenReaders(<>{getCountryNameFromCode(countryCodeData.cca3, storedCountryData.countries)
          } moved down, now matched to {quizState.quiz.labelFunction(
              storedCountryData, sortedMatchValues[newMatchValueIndex].cca3)}{
          singleCapacity && countryCodesAtSlot.length ? `, swapped with ${
            getCountryNameFromCode(countryCodesAtSlot[0].cca3, storedCountryData.countries)
          }.` : ""}</>);
    });
  }

  return (
    (quizState.quiz.structure !== "matching") ? null : <>
      <p className="sr-only" aria-live="polite">{srAnnouncement}</p>

      <div className="quiz-controls">
        <DraggableCountryPool headerId="unmatched-pool-header"
            headerText={`Unmatched ${quizState.quiz.type === "MATCH_TO_BORDERING_COUNTRIES" ?
                "Bordering " : ""}Countries`}
            emptyMessage="All countries have been matched"
            selectedCountryCode={selectedCountryCode?.cca3}
            onDrop={handleDropForUnmatchedPool}>
          {unmatchedCountryCodes.map(countryCodeData => {
            const key = `${countryCodeData.originatingCca3}_${countryCodeData.cca3}_${
                countryCodeData.secondaryIndex}`;

            // Allow duplicate country codes for bordering country and fun fact quizzes
            return (
              <li key={key} style={{ viewTransitionName: key}}>
                <DraggableCountry cca3={countryCodeData.cca3}
                    revealedValueLabel={quizState.quiz.type === "MATCH_TO_BORDERING_COUNTRIES" ?
                        undefined : sortedMatchValues.find(
                            matchData => matchData.cca3 === countryCodeData.cca3)?.label}
                    isSelected={doCountryCodeOverridesMatch(countryCodeData, selectedCountryCode)
                        && selectedCountryCodeMatchIndex < 0}
                    isDragged={doCountryCodeOverridesMatch(countryCodeData, selectedCountryCode)
                        && selectedCountryCodeMatchIndex < 0 && isDraggingCountryCode}
                    roundActive={roundActive}
                    quizActive={quizActive}
                    quizType={quizState.quiz.type}
                    onDragStart={(event) => handleDragStart(event, countryCodeData)}
                    onDragEnd={handleDragEnd}
                    onDrag={handleDrag}
                    onDrop={handleDropForUnmatchedPool}
                    onAdd={() => onAdd(countryCodeData)} />
              </li>
            );
          })}
        </DraggableCountryPool>

        <DraggableCountryPool headerId="matched-pool-header"
            headerText={`${quizState.quiz.type === "MATCH_TO_BORDERING_COUNTRIES" ?
                "Countries" : quizState.quiz.matchTypeLabel} to Match to`}
            canBeDroppedIntoDirectly={false}
            isTargetContainer
            emptyMessage="Error">
          {sortedMatchValues.map((matchData, matchIndex) => {
            const matchValueCountryCodes = sortedMatchedCountryCodes[matchIndex];
            const itemKey = `${getReactNodeString(matchData.label)}_${matchIndex}`;

            // Can't be a fragment, as it needs the view transition style applied
            const CountryWrapper = singleCapacity ? 'div' : 'li';

            let matchDataLabel = matchData.label;
            let revealedBorderingCountries: React.ReactNode = undefined;

            if (quizState.quiz.type === "MATCH_TO_FUN_FACTS") {
              matchDataLabel = <p>{matchDataLabel}</p>
            }

            if (quizState.quiz.type === "MATCH_TO_BORDERING_COUNTRIES" && !roundActive) {
              let borderingCountryCodes: Cca3Code[] | undefined = undefined;

              if (matchData.value) {
                borderingCountryCodes = matchData.value === "None" ? [] : matchData.value.split(", ");
                sortCountryCodesByName(borderingCountryCodes, storedCountryData.countries);
              }

              if (!quizActive && numberOfLockedInCountryCodes < quizCountryCodes.length) {
                revealedBorderingCountries = <CountryLinksValue value={borderingCountryCodes} />;
              }

              matchDataLabel = <>{quizActive ? matchDataLabel
                  : <Link to={`/countries/${matchData.cca3}`}>{matchDataLabel}</Link>} ({
                storedCountryData.countries[matchData.cca3]?.data?.continents?.formattedValue ??
                    "Continents Unavailable"
              }){!quizActive && numberOfLockedInCountryCodes < quizCountryCodes.length && ":"}</>;
            }

            const worldFactbookKey =
                storedCountryData.countries[matchData.cca3]?.data?.worldFactbookCountryKey;

            const contentBelowHeader = !roundActive
                && quizState.quiz.type === "MATCH_TO_BORDERING_COUNTRIES" ?
            <div className="content-below-header">
              {revealedBorderingCountries}

              <div><CaptionedImageDialogButton
                  imageDescription="Country Location"
                  buttonLabelOverride="View Country Location"
                  src={worldFactbookKey ? getLocatorMapSrc(worldFactbookKey) : undefined}
                  caption={storedCountryData.countries[matchData.cca3]?.data?.location ??
                      "The location of this country. No additional description available."}>
                View Country Location
              </CaptionedImageDialogButton></div>
            </div> : null;

            // Could use the country code as the key when available, so that focus
            // automatically remains on the country component's buttons when moved up/down,
            // but the key needs to be based on the slot in order to preserve image loading
            // and details collapse states, so need to handle focus manually...
            return (
              <li key={itemKey}>
                <DraggableCountryPool headerId={`matched-pool-header-${matchIndex}`}
                    headerText={matchDataLabel}
                    headerLevel={quizState.quiz.type === "MATCH_TO_FUN_FACTS"
                        || quizState.quiz.type === "MATCH_TO_FLAGS"
                        || quizState.quiz.type === "MATCH_TO_LOCATIONS" ? 0 : 3}
                    contentBelowHeader={contentBelowHeader}
                    singleCapacity={singleCapacity}
                    canBeDroppedIntoDirectly={!matchValueCountryCodes?.length
                        || (!(selectedCountryCode && matchValueCountryCodes.find(matchedCountryCode =>
                            doCountryCodeOverridesMatch(matchedCountryCode, selectedCountryCode)))
                        && !(singleCapacity && quizState.countryCodesLockedInAsCorrect[matchIndex]?.find(
                            lockedInCountryCode => doCountryCodeOverridesMatch(lockedInCountryCode, selectedCountryCode))))}
                    emptyMessage={roundActive ? `Drag${singleCapacity ? " the" : " any"} matching ${
                        singleCapacity ? "country" : "countries"} here` : ""}
                    selectedCountryCode={selectedCountryCode?.cca3}
                    isTargetForAdd={targetMatchIndexForAdd === matchIndex}
                    hideTargetForAddButton={singleCapacity
                        && !!quizState.matchedCountryCodes[matchIndex]?.length}
                    onTargetForAddToggle={roundActive && !(singleCapacity
                        && quizState.countryCodesLockedInAsCorrect[matchIndex]?.length) ?
                        () => setTargetMatchIndexForAdd(
                            matchIndex === targetMatchIndexForAdd ? -1 : matchIndex) : undefined}
                    onDrop={event => handleDropForMatchValue(event, matchIndex)}>
                  {matchValueCountryCodes ?
                      matchValueCountryCodes.map(countryCodeData => {
                    const key = `${countryCodeData.originatingCca3}_${countryCodeData.cca3}_${
                        countryCodeData.secondaryIndex}`;

                    // Allow duplicate country codes for fun fact and bordering country quizzes
                    return (
                      <CountryWrapper key={key} style={{ viewTransitionName: key}}>
                        <DraggableCountry cca3={countryCodeData.cca3}
                          isSelected={doCountryCodeOverridesMatch(countryCodeData, selectedCountryCode)
                              && matchIndex === selectedCountryCodeMatchIndex}
                          isDragged={doCountryCodeOverridesMatch(countryCodeData, selectedCountryCode)
                              && matchIndex === selectedCountryCodeMatchIndex
                              && isDraggingCountryCode}
                          isLockedIn={!!quizState.countryCodesLockedInAsCorrect[matchIndex]
                              ?.find(lockedInCountryCode =>
                                  doCountryCodeOverridesMatch(lockedInCountryCode, countryCodeData))}
                          roundActive={roundActive}
                          quizActive={quizActive}
                          quizType={quizState.quiz.type}
                          onDragStart={(event) => handleDragStart(event, countryCodeData, matchIndex)}
                          onDragEnd={handleDragEnd}
                          onDrag={handleDrag}
                          onMoveUp={() => onMoveUp(countryCodeData, matchIndex)}
                          onMoveDown={() => onMoveDown(countryCodeData, matchIndex)}
                          onRemove={() => onRemove(countryCodeData, matchIndex)} />
                      </CountryWrapper>
                    )}) : null
                  }
                </DraggableCountryPool>
              </li>
            );
          })}
        </DraggableCountryPool>
      </div>

      {/* Acknowledge if all match values are identical (such as currencies) */}
      {roundActive && allValuesAreIdentical && <p className="quiz-message" aria-live="polite">
        Whoops, the {quizState.quiz.matchTypeLabel.toLocaleLowerCase()} are all identical.<br />
        Looks like you get a freebie this round!
      </p>}

      {/* Reminder that you don't have to submit everything in one go */}
      {roundActive && !Object.keys(quizState.countryCodesLockedInAsCorrect).length
          && !!quizState.incorrectSubmissions.length
          && Object.values(Object.fromEntries(quizState.incorrectSubmissions[
              quizState.incorrectSubmissions.length - 1])).flat().length
              === quizCountryCodes.length
          && <p className="quiz-message" aria-live="polite">
        Remember: {QUIZ_ONE_GO_TIP}
      </p>}

      {numberOfLockedInCountryCodes < quizCountryCodes.length && <QuizSubmitButton
          onSubmit={attemptSubmit}
          alreadyGuessed={alreadyGuessed}
          disabled={Object.values(sortedMatchedCountryCodes).flat().length <= numberOfLockedInCountryCodes}
          submissionsRemaining={quizState.submissionsRemaining} />}
    </>
  );
}

export default QuizControlsForMatching;
