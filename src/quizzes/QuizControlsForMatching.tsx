import type { Cca3Code } from "@yusifaliyevpro/countries/types";
import React, { useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import { Link } from "react-router-dom";
import CaptionedImageDialogButton from "../CaptionedImageDialogButton";
import CountryLinksValue from "../CountryLinksValue";
import useCountries from "../hooks/useCountries";
import { CUSTOM_DRAG_TYPE } from "../utils/consts";
import { sortCountryCodesByName } from "../utils/countryUtils";
import { getLocatorMapSrc, getReactNodeString, removeFirstMatchFromArray } from "../utils/utils";
import CaptionedImageForMatching from "./CaptionedImageForMatching";
import DraggableCountry from "./DraggableCountry";
import DraggableCountryPool from "./DraggableCountryPool";
import QuizSubmitButton from "./QuizSubmitButton";
import type { MatchingQuizState, QuizState } from "./quizConfig";
import { isQuizActive } from "./quizUtils";

interface QuizControlsForMatchingProps {
  quizState: MatchingQuizState;
  setQuizState: (quizState: QuizState) => void;
}

function QuizControlsForMatching({quizState, setQuizState}: QuizControlsForMatchingProps) {
  const [selectedCountryCode, setSelectedCountryCode] =
      useState<Cca3Code | null>(null);
  const [selectedCountryCodeArrayIndex, setSelectedCountryCodeArrayIndex] =
      useState<number>(-1);
  const [selectedCountryCodeMatchIndex, setSelectedCountryCodeMatchIndex] =
      useState<number>(-1);
  const [isDraggingCountryCode, setIsDraggingCountryCode] = useState(false);
  const dragTestTimeoutIdRef = useRef<NodeJS.Timeout | number>(0);

  const [targetMatchIndexForAdd, setTargetMatchIndexForAdd] = useState<number>(-1);

  // Announcement for screen readers
  const [srAnnouncement, setSrAnnouncement] = useState<React.ReactNode>('');
  const srAnnouncementTimeoutIdRef = useRef<NodeJS.Timeout | number>(0);

  const quizCountryCodes = quizState.countryCodesOverride ?? quizState.countryCodes;
  const singleCapacity = quizState.quiz.singleCapacity;

  const numberOfLockedInCountryCodes = useMemo(() => {
    return Object.values(quizState.countryCodesLockedInAsCorrect).flat().length;
  }, [quizState.countryCodesLockedInAsCorrect]);

  const quizActive = isQuizActive(quizState);
  const roundActive = quizActive && quizState.submissionsRemaining > 0
      && numberOfLockedInCountryCodes < quizCountryCodes.length;

  function setMatchedCountryCodes(matchedCountryCodes: Partial<Record<number, Cca3Code[]>>) {
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

    if (quizState.quiz.type === "MATCH_TO_BORDERING_COUNTRIES") {
      // Sort alphabetically by country name
      matchValues.sort((a, b) => {
        return storedCountryData.countries[a.cca3]?.data?.name
            .localeCompare(storedCountryData.countries[b.cca3]?.data?.name ?? "") ?? 0;
      });
    } else {
      // Sort alphabetically by value (avoiding markup parsing with the label)
      matchValues.sort((a, b) => {
        return a.value.localeCompare(b.value);
      });
    }

    return matchValues;
  }, [storedCountryData, quizState.quiz, quizState.countryCodes]);

  const unmatchedCountryCodes = useMemo(() => {
    const unmatchedCodes = [...quizCountryCodes];

    // Can't just filter, because there might be duplicates
    for (const cca3 of Object.values(quizState.matchedCountryCodes).flat()) {
      removeFirstMatchFromArray(unmatchedCodes, cca3);
    }

    sortCountryCodesByName(unmatchedCodes, storedCountryData.countries);

    return unmatchedCodes;
  }, [quizState.matchedCountryCodes, storedCountryData.countries, quizCountryCodes]);

  const sortedMatchedCountryCodes = useMemo(() => {
    const matchedCountryCodes = structuredClone(quizState.matchedCountryCodes);

    // Sort alphabetically by country name
    for (const cca3Array of Object.values(matchedCountryCodes)) {
      if (cca3Array?.length) {
        sortCountryCodesByName(cca3Array, storedCountryData.countries);
      }
    }

    return matchedCountryCodes;
  }, [quizState.matchedCountryCodes, storedCountryData.countries]);

  const alreadyGuessed = useMemo(() => {
    for (const incorrectSubmission of quizState.incorrectSubmissions) {
      if (incorrectSubmission.join("|") ===
          Object.entries(sortedMatchedCountryCodes).join("|")) {
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

  function handleDragStart(event: DragEvent, countryCode: Cca3Code, arrayIndex: number, matchIndex = -1) {
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
    setSelectedCountryCodeArrayIndex(arrayIndex);
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
    setSelectedCountryCodeArrayIndex(-1);
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
    let incorrectSubmissions: [string, Cca3Code[]][][] = [];

    // Submission is correct if all matched (non-blank) values are correct
    for (const [index, countryCodes] of Object.entries(sortedMatchedCountryCodes)) {
      const matchedValue = sortedMatchValues[parseInt(index)].value;

      if (!matchedValue || !countryCodes?.length) {
        continue;
      }

      for (const countryCode of countryCodes) {
        if (quizState.quiz.type === "MATCH_TO_BORDERING_COUNTRIES") {
          // Matched value is comma separated list of bordering country codes
          if (!matchedValue.split(", ").includes(countryCode)) {
            submissionCorrect = false;
            break;
          }
        } else {
          const correctValue = quizState.quiz.valueFunction(storedCountryData, countryCode);

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
          Object.entries(newMatchedCountryCodes) as [string, Cca3Code[]][]];

      // Clear out any non-locked-in countries
      for (const [index, countryCodes] of Object.entries(sortedMatchedCountryCodes)) {
        if (countryCodes?.length) {
          newMatchedCountryCodes[parseInt(index)] = countryCodes.filter(countryCode =>
              newLockedInCountryCodes[parseInt(index)]?.includes(countryCode));
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

      // TODO - sound effect

      screenReaderMessageParts.push("Submission incorrect.");
    } else {
      screenReaderMessageParts.push("Submission correct and locked-in.");
      newLockedInCountryCodes = structuredClone(newMatchedCountryCodes);
    }

    screenReaderMessageParts.push(` ${submissionsRemaining} submission${
          submissionsRemaining === 1 ? "" : "s"} remaining.`);

    if (quizCountryCodes.length === Object.values(newLockedInCountryCodes).flat().length) {
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

  function canSlotAcceptCountryCode(countryCode: Cca3Code, matchIndex: number) {
    const countryCodesAtSlot = sortedMatchedCountryCodes[matchIndex];

    if (countryCodesAtSlot?.length) {
      if (singleCapacity
          && quizState.countryCodesLockedInAsCorrect[matchIndex]?.includes(countryCodesAtSlot[0])) {
        // Occupied by a locked-in country
        return false;
      }

      if (countryCodesAtSlot.includes(countryCode)) {
        // Occupied by the same country already
        return false;
      }
    }

    return true;
  }

  // Remove the country code from the slot at the designated index
  function onRemove(countryCode: Cca3Code, matchIndex: number) {
    const matchCountryCodes = sortedMatchedCountryCodes[matchIndex];

    if (!matchCountryCodes?.length) {
      return;
    }

    const matchedData = sortedMatchValues[matchIndex];

    const newMatchedCountryCodes = structuredClone(sortedMatchedCountryCodes);
    const newCountryCodes = [...matchCountryCodes];
    removeFirstMatchFromArray(newCountryCodes, countryCode);

    if (newCountryCodes.length) {
      newMatchedCountryCodes[matchIndex] = newCountryCodes;
    } else {
      delete newMatchedCountryCodes[matchIndex];
    }

    setMatchedCountryCodes(newMatchedCountryCodes);

    // Use the original label to avoid using the markup for flags
    announceForScreenReaders(<>{storedCountryData.countries[countryCode]?.data?.name ?? countryCode
        } unmatched from {quizState.quiz.labelFunction(storedCountryData, matchedData.cca3)}.</>);
  }

  // Add to the slot at the designated index if set,
  // or else to the first one with capacity.  If single capacity and the provided index
  // is occupied and not locked-in, swap with the country code there.
  // If it is locked-in, do nothing. Also handles if dragged from another index.
  function onAdd(countryCode: Cca3Code, matchIndex = targetMatchIndexForAdd) {
    if (matchIndex >= 0 && !canSlotAcceptCountryCode(countryCode, matchIndex)) {
      return;
    }

    if (matchIndex < 0) {
      // No designated slot, so find the first available slot
      for (let i = 0; i < sortedMatchValues.length; i++) {
        if (!singleCapacity || !sortedMatchedCountryCodes[i]?.length) {
          matchIndex = i;
          break;
        }
      }
    }

    let countryCodesAtSlot = sortedMatchedCountryCodes[matchIndex];

    if (matchIndex >= 0 && matchIndex !== selectedCountryCodeMatchIndex) {
      const newMatchedCountryCodes = structuredClone(sortedMatchedCountryCodes);

      if (selectedCountryCodeMatchIndex >= 0) {
        const newCountryCodes = [...(sortedMatchedCountryCodes[selectedCountryCodeMatchIndex] ?? [])];
        removeFirstMatchFromArray(newCountryCodes, countryCode);

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
      newCountryCodes.push(countryCode);
      newMatchedCountryCodes[matchIndex] = newCountryCodes;

      setMatchedCountryCodes(newMatchedCountryCodes);

      // Use the original label to avoid using the markup for flags
      announceForScreenReaders(<>{storedCountryData.countries[countryCode]?.data?.name ?? countryCode
          } now matched to {
            quizState.quiz.labelFunction(storedCountryData, sortedMatchValues[matchIndex].cca3)
          }{singleCapacity && countryCodesAtSlot?.length ? `, swapped with ${
            storedCountryData.countries[countryCodesAtSlot[0]]?.data?.name ?? countryCodesAtSlot[0]
          }` : ""}.</>);
    }
  }

  // Move to previous index with capacity in the sortedMatchValues order,
  // looping around if the first one, and swapping with any country code there if single capacity
  function onMoveUp(countryCode: Cca3Code, matchIndex: number) {
    const matchCountryCodes = sortedMatchedCountryCodes[matchIndex];

    if (!matchCountryCodes?.length) {
      return;
    }

    let newMatchValueIndex = -1;
    let countryCodesAtSlot: Cca3Code[] | undefined;

    for (let i = matchIndex - 1; i !== matchIndex; i--) {
      if (i < 0) {
        i = sortedMatchValues.length;
        continue;
      }

      if (!canSlotAcceptCountryCode(countryCode, i)) {
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

    const newCountryCodes = [...(newMatchedCountryCodes[matchIndex] ?? [])];
    removeFirstMatchFromArray(newCountryCodes, countryCode);

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
    newMatchedCountryCodes[newMatchValueIndex] = [...countryCodesAtSlot, countryCode];
    setMatchedCountryCodes(newMatchedCountryCodes);

    setTimeout(() => {
      const arrayIndex = newMatchedCountryCodes[newMatchValueIndex]?.indexOf(countryCode) ?? -1;

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
    announceForScreenReaders(<>{storedCountryData.countries[countryCode]?.data?.name ?? countryCode
        } moved up, now matched to {quizState.quiz.labelFunction(
            storedCountryData, sortedMatchValues[newMatchValueIndex].cca3)}{
        singleCapacity && countryCodesAtSlot.length ? `, swapped with ${
          storedCountryData.countries[countryCodesAtSlot[0]]?.data?.name ?? countryCodesAtSlot[0]
        }.` : ""}</>);
  }

  // Move to next index with capacity in the sortedMatchValues order,
  // looping around if the last one, and swapping with any country code there if single capacity
  function onMoveDown(countryCode: Cca3Code, matchIndex: number) {
     const matchCountryCodes = sortedMatchedCountryCodes[matchIndex];

    if (!matchCountryCodes?.length) {
      return;
    }

    let newMatchValueIndex = -1;
    let countryCodesAtSlot: Cca3Code[] | undefined;

    for (let i = matchIndex + 1; i !== matchIndex; i++) {
      if (i >= sortedMatchValues.length) {
        i = -1;
        continue;
      }

      if (!canSlotAcceptCountryCode(countryCode, i)) {
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

    const newCountryCodes = [...(newMatchedCountryCodes[matchIndex] ?? [])];
    removeFirstMatchFromArray(newCountryCodes, countryCode);

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
    newMatchedCountryCodes[newMatchValueIndex] = [...countryCodesAtSlot, countryCode];
    setMatchedCountryCodes(newMatchedCountryCodes);

    setTimeout(() => {
      const arrayIndex = newMatchedCountryCodes[newMatchValueIndex]?.indexOf(countryCode) ?? -1;

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
    announceForScreenReaders(<>{storedCountryData.countries[countryCode]?.data?.name ?? countryCode
        } moved down, now matched to {quizState.quiz.labelFunction(
            storedCountryData, sortedMatchValues[newMatchValueIndex].cca3)}{
        singleCapacity && countryCodesAtSlot.length ? `, swapped with ${
          storedCountryData.countries[countryCodesAtSlot[0]]?.data?.name ?? countryCodesAtSlot[0]
        }.` : ""}</>);
  }

  return (
    (quizState.quiz.structure !== "matching") ? null : <>
      <p className="sr-only" aria-live="polite">{srAnnouncement}</p>

      <div className="quiz-controls">
        <DraggableCountryPool headerId="unmatched-pool-header"
            headerText={`Unmatched ${quizState.quiz.type === "MATCH_TO_BORDERING_COUNTRIES" ?
                "Bordering " : ""}Countries`}
            emptyMessage="All countries have been matched"
            selectedCountryCode={selectedCountryCode}
            onDrop={handleDropForUnmatchedPool}>
          {unmatchedCountryCodes.map((countryCode, index) => (
            // Allow duplicate country codes for bordering country quizzes
            // eslint-disable-next-line react-x/no-array-index-key
            <li key={`${(countryCode)}_${index}`}>
              <DraggableCountry cca3={countryCode}
                  revealedValueLabel={quizState.quiz.type === "MATCH_TO_BORDERING_COUNTRIES" ?
                      undefined : sortedMatchValues.find(
                          matchData => matchData.cca3 === countryCode)?.label}
                  isSelected={countryCode === selectedCountryCode && index === selectedCountryCodeArrayIndex
                      && selectedCountryCodeMatchIndex < 0}
                  isDragged={countryCode === selectedCountryCode && index === selectedCountryCodeArrayIndex
                      && selectedCountryCodeMatchIndex < 0 && isDraggingCountryCode}
                  roundActive={quizState.submissionsRemaining > 0
                      && numberOfLockedInCountryCodes < quizCountryCodes.length}
                  quizActive={quizState.submissionsRemaining > 0
                      || numberOfLockedInCountryCodes >= quizCountryCodes.length}
                  quizType={quizState.quiz.type}
                  onDragStart={(event) => handleDragStart(event, countryCode, index)}
                  onDragEnd={handleDragEnd}
                  onDrag={handleDrag}
                  onDrop={handleDropForUnmatchedPool}
                  onAdd={() => onAdd(countryCode)} />
            </li>
          ))}
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
            const CountryWrapper = singleCapacity ? React.Fragment : 'li';
            let matchDataLabel = matchData.label;
            let revealedBorders: React.ReactNode = undefined;

            if (quizState.quiz.type === "MATCH_TO_BORDERING_COUNTRIES" && !roundActive) {
              let borderingCountryCodes: Cca3Code[] | undefined = undefined;
              // let borderingCountries: string[] | undefined = undefined;

              if (matchData.value) {
                borderingCountryCodes = matchData.value === "None" ? [] : matchData.value.split(", ");
                sortCountryCodesByName(borderingCountryCodes, storedCountryData.countries);
                /* borderingCountries = borderingCountryCodes.map(countryCode => (
                  storedCountryData.countries[countryCode]?.data?.name ?? countryCode
                )); */
              }

              if (!quizActive) {
                revealedBorders = <CountryLinksValue value={borderingCountryCodes} />;
              }

              matchDataLabel = <>{quizActive ? matchDataLabel
                  : <Link to={`/countries/${matchData.cca3}`}>{matchDataLabel}</Link>} ({
                storedCountryData.countries[matchData.cca3]?.data?.continents?.formattedValue ??
                    "Continents Unavailable"
              }){!quizActive && ":"}</>;
            }

            const worldFactbookKey =
                storedCountryData.countries[matchData.cca3]?.data?.worldFactbookCountryKey;

            const contentBelowHeader = !roundActive
                && quizState.quiz.type === "MATCH_TO_BORDERING_COUNTRIES" ?
            <div className="content-below-header">
              {revealedBorders}

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
                <DraggableCountryPool headerId={`matched-pool-header-${itemKey}`}
                    headerText={matchDataLabel}
                    headerLevel={quizState.quiz.type === "MATCH_TO_FLAGS"
                        || quizState.quiz.type === "MATCH_TO_LOCATIONS" ? 0 : 3}
                    contentBelowHeader={contentBelowHeader}
                    singleCapacity={singleCapacity}
                    canBeDroppedIntoDirectly={!matchValueCountryCodes?.length
                        || (!(selectedCountryCode && matchValueCountryCodes.includes(selectedCountryCode))
                        && !(singleCapacity && quizState.countryCodesLockedInAsCorrect[matchIndex]?.includes(
                            matchValueCountryCodes[0])))}
                    emptyMessage={roundActive ? `Drag${singleCapacity ? " the" : ""} matching ${
                        singleCapacity ? "country" : "countries"} here` : ""}
                    selectedCountryCode={selectedCountryCode}
                    isTargetForAdd={targetMatchIndexForAdd === matchIndex}
                    onTargetForAddToggle={roundActive && !(singleCapacity
                        && quizState.matchedCountryCodes[matchIndex]?.length) ?
                        () => setTargetMatchIndexForAdd(
                            matchIndex === targetMatchIndexForAdd ? -1 : matchIndex) : undefined}
                    onDrop={event => handleDropForMatchValue(event, matchIndex)}>
                  {matchValueCountryCodes ?
                      matchValueCountryCodes.map((countryCode, index) => (
                    // Allow duplicate country codes for bordering country quizzes
                    // eslint-disable-next-line react-x/no-array-index-key
                    <CountryWrapper key={`${(countryCode)}_${index}`}>
                      <DraggableCountry cca3={countryCode}
                        isSelected={countryCode === selectedCountryCode
                            && index === selectedCountryCodeArrayIndex
                            && matchIndex === selectedCountryCodeMatchIndex}
                        isDragged={countryCode === selectedCountryCode
                            && index === selectedCountryCodeArrayIndex
                            && matchIndex === selectedCountryCodeMatchIndex
                            && isDraggingCountryCode}
                        isLockedIn={quizState.countryCodesLockedInAsCorrect[matchIndex]
                            ?.includes(countryCode)}
                        roundActive={roundActive}
                        quizActive={quizActive}
                        quizType={quizState.quiz.type}
                        onDragStart={(event) => handleDragStart(event, countryCode, index, matchIndex)}
                        onDragEnd={handleDragEnd}
                        onDrag={handleDrag}
                        onMoveUp={() => onMoveUp(countryCode, matchIndex)}
                        onMoveDown={() => onMoveDown(countryCode, matchIndex)}
                        onRemove={() => onRemove(countryCode, matchIndex)} />
                    </CountryWrapper>
                  )) : null}
                </DraggableCountryPool>
              </li>
            );
          })}
        </DraggableCountryPool>
      </div>

      {numberOfLockedInCountryCodes < quizCountryCodes.length && <QuizSubmitButton
          onSubmit={attemptSubmit}
          alreadyGuessed={alreadyGuessed}
          disabled={Object.values(sortedMatchedCountryCodes).flat().length <= numberOfLockedInCountryCodes}
          submissionsRemaining={quizState.submissionsRemaining} />}
    </>
  );
}

export default QuizControlsForMatching;
