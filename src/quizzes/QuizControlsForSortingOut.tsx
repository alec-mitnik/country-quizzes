import type { Cca3Code } from "@yusifaliyevpro/countries/types";
import React, { useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import { Link } from "react-router-dom";
import type { StoredCountry } from "../../types/commonTypes";
import CaptionedImageDialogButton from "../CaptionedImageDialogButton";
import type { CountryStorage } from "../CountriesProvider";
import useCountries from "../hooks/useCountries";
import { CUSTOM_DRAG_TYPE, QUIZ_MAX_LEVEL, QUIZ_ONE_GO_TIP, QUIZ_ROUNDS_PER_LEVEL } from "../utils/consts";
import { getCountryNameFromCode, getFieldReadableValue, getPluralFieldLabel } from "../utils/countryUtils";
import { getLocatorMapSrc } from "../utils/utils";
import DraggableCountry from "./DraggableCountry";
import DraggableCountryPool from "./DraggableCountryPool";
import QuizSubmitButton from "./QuizSubmitButton";
import type { QuizState, SortingOutQuizState } from "./quizConfig";
import { isQuizActive } from "./quizUtils";

function getSortedMatchedCountryFields(storedCountryData: CountryStorage,
    matchedCountryFields: Partial<Record<Cca3Code, Partial<Record<keyof StoredCountry, Cca3Code>>>>,
    includeCountryFieldLabel: boolean) {
  const sorted: Partial<Record<Cca3Code, Partial<Record<keyof StoredCountry, Cca3Code>>>> = {};

  // Country code keys should already be sorted, matching the countryCodes value
  for (const [containerCca3, fieldMap] of Object.entries(matchedCountryFields)) {
    if (!fieldMap) {
      continue;
    }

    // Convert to array, sort, then back to object
    const entries = Object.entries(fieldMap) as [keyof StoredCountry, Cca3Code][];
    entries.sort((a, b) => {
      const [fieldA, cca3A] = a;
      const [fieldB, cca3B] = b;
      const aValue = getFieldReadableValue(storedCountryData, cca3A, fieldA, includeCountryFieldLabel);
      const bValue = getFieldReadableValue(storedCountryData, cca3B, fieldB, includeCountryFieldLabel);
      return aValue.localeCompare(bValue);
    });

    sorted[containerCca3 as Cca3Code] = Object.fromEntries(entries);
  }

  return sorted;
}

interface QuizControlsForSortingOutProps {
  quizState: SortingOutQuizState;
  setQuizState: (quizState: QuizState) => void;
}

function QuizControlsForSortingOut({quizState, setQuizState}: QuizControlsForSortingOutProps) {
  const [selectedCountryFieldCountryCode, setSelectedCountryFieldCountryCode] =
      useState<Cca3Code | null>(null);
  const [selectedCountryField, setSelectedCountryField] =
      useState<keyof StoredCountry | null>(null);
  const [selectedCountryCodeSlot, setSelectedCountryCodeSlot] =
      useState<Cca3Code | null>(null);
  const [isDraggingCountryField, setIsDraggingCountryField] = useState(false);
  const dragTestTimeoutIdRef = useRef<NodeJS.Timeout | number>(0);

  const [targetMatchCountryCodeForAdd, setTargetMatchCountryCodeForAdd] = useState<Cca3Code | null>(null);

  // Announcement for screen readers
  const [srAnnouncement, setSrAnnouncement] = useState<React.ReactNode>('');
  const srAnnouncementTimeoutIdRef = useRef<NodeJS.Timeout | number>(0);

  const singleCapacity = quizState.countryFields.length === 1;

  const numberOfLockedInCountryFields = useMemo(() => {
    return Object.values(quizState.countryFieldsLockedInAsCorrect).flat().length;
  }, [quizState.countryFieldsLockedInAsCorrect]);

  // Keep countryCodesLockedInAsCorrect in sync and up to date
  useEffect(() => {
    const countryCodesLockedInAsCorrect: Cca3Code[] = [];

    for (const countryCode of Object.keys(quizState.countryFieldsLockedInAsCorrect)) {
      if ((quizState.countryFieldsLockedInAsCorrect[countryCode] ?? []).length
          >= quizState.countryFields.length) {
        countryCodesLockedInAsCorrect.push(countryCode);
      }
    }

    // Only update if the array actually changed, or else it's an infinite loop
    const current = quizState.countryCodesLockedInAsCorrect;

    if (countryCodesLockedInAsCorrect.length !== current.length ||
        !countryCodesLockedInAsCorrect.every((code, i) => code === current[i])) {
      setQuizState({
        ...quizState,
        countryCodesLockedInAsCorrect,
      });
    }
  }, [quizState, setQuizState]);

  const quizActive = isQuizActive(quizState);
  const roundActive = quizActive && quizState.submissionsRemaining > 0
      && numberOfLockedInCountryFields < quizState.countryCodes.length * quizState.countryFields.length;

  function setMatchedCountryFields(matchedCountryFields: Partial<Record<Cca3Code, Partial<Record<keyof StoredCountry, Cca3Code>>>>) {
    setQuizState({
      ...quizState,
      matchedCountryFields,
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

  const sortedUnmatchedValues = useMemo(() => {
    // Build a set of all matched field-country pairs for quick lookup
    const matchedPairs = new Set<string>();

    for (const fieldMap of Object.values(quizState.matchedCountryFields)) {
      if (!fieldMap) {
        continue;
      }

      for (const [field, cca3] of Object.entries(fieldMap)) {
        matchedPairs.add(`${field}-${cca3}`);
      }
    }

    const unmatched: Partial<Record<keyof StoredCountry, Cca3Code[]>> = {};

    for (const field of quizState.countryFields) {
      const unmatchedForField = quizState.countryCodes
        .filter(cca3 => !matchedPairs.has(`${field}-${cca3}`))
        .sort((a, b) => {
          const aValue = getFieldReadableValue(storedCountryData, a, field, !singleCapacity);
          const bValue = getFieldReadableValue(storedCountryData, b, field, !singleCapacity);
          return aValue.localeCompare(bValue);
        });

      if (unmatchedForField.length) {
        unmatched[field] = unmatchedForField;
      }
    }

    return unmatched;
  }, [singleCapacity, storedCountryData, quizState.countryFields, quizState.countryCodes,
      quizState.matchedCountryFields]);

  const sortedMatchedCountryFields = useMemo(() => {
    return getSortedMatchedCountryFields(storedCountryData, quizState.matchedCountryFields, !singleCapacity);
  }, [storedCountryData, quizState.matchedCountryFields, singleCapacity]);

  const alreadyGuessed = useMemo(() => {
    for (const incorrectSubmission of quizState.incorrectSubmissions) {
      if (JSON.stringify(incorrectSubmission) ===
          JSON.stringify(quizState.matchedCountryFields)) {
        return true;
      }
    };

    return false;
  }, [quizState.matchedCountryFields, quizState.incorrectSubmissions]);

  useEffect(() => {
    // Stop targeting for add when all field slots are filled
    if (targetMatchCountryCodeForAdd
        && Object.values(sortedMatchedCountryFields[targetMatchCountryCodeForAdd] ?? {}).length
            >= quizState.countryFields.length) {
      setTargetMatchCountryCodeForAdd(null);
    }
  }, [sortedMatchedCountryFields, singleCapacity, targetMatchCountryCodeForAdd,
    quizState.countryFields.length, setTargetMatchCountryCodeForAdd]);

  function announceForScreenReaders(message: React.ReactNode) {
    clearTimeout(srAnnouncementTimeoutIdRef.current);
    setSrAnnouncement(message);

    // Clear the message after a delay so that it doesn't remain
    // navigable by screen readers in browse mode
    srAnnouncementTimeoutIdRef.current = setTimeout(() => setSrAnnouncement(''), 1000);
  }

  function handleDragStart(event: DragEvent, countryCode: Cca3Code,
      countryField: keyof StoredCountry, countryCodeSlot: Cca3Code | null = null) {
    if (event.dataTransfer.types.length) {
      // Deselect any selected text
      window.getSelection()?.removeAllRanges();

      // Trying to salvage the current drag doesn't tend to work, so just cancel it
      event.preventDefault();
      return;
    }

    // Use a custom data type to prevent interactions with dragged text or the like
    event.dataTransfer.setData(CUSTOM_DRAG_TYPE, `${countryCode}_${countryField}`);
    event.dataTransfer.effectAllowed = 'move';

    setSelectedCountryFieldCountryCode(countryCode);
    setSelectedCountryField(countryField);
    setSelectedCountryCodeSlot(countryCodeSlot);
    setIsDraggingCountryField(true);

    clearTimeout(dragTestTimeoutIdRef.current);
    dragTestTimeoutIdRef.current = setTimeout(() => {
      // If timeout wasn't cleared, dragging is probably broken, so cancel it
      // (seems to be an issue on some Android devices)
      handleDragEnd();
    }, 2000);
  }

  function handleDrag() {
    clearTimeout(dragTestTimeoutIdRef.current);

    if (targetMatchCountryCodeForAdd) {
      setTargetMatchCountryCodeForAdd(null);
    }
  }

  function handleDragEnd() {
    // Note that this won't get triggered if the dragged element
    // is unmounted in the drop handler, so drop handlers that
    // move elements need to clear the selection themselves
    setSelectedCountryFieldCountryCode(null);
    setSelectedCountryField(null);
    setSelectedCountryCodeSlot(null);
    setIsDraggingCountryField(false);
  }

  function handleDropForMatchCountry(event: DragEvent, countryCodeSlot: Cca3Code) {
    if (selectedCountryFieldCountryCode && selectedCountryField
        && event.dataTransfer.types.every(type => type === CUSTOM_DRAG_TYPE)) {
      event.preventDefault();
      event.stopPropagation();
      onAdd(selectedCountryField, selectedCountryFieldCountryCode, countryCodeSlot);
      handleDragEnd();
    }
  }

  function handleDropForUnmatchedFieldPool(event: DragEvent) {
    if (selectedCountryCodeSlot && selectedCountryField && selectedCountryFieldCountryCode
        && event.dataTransfer.types.every(type => type === CUSTOM_DRAG_TYPE)) {
      event.preventDefault();
      event.stopPropagation();
      onRemove(selectedCountryField, selectedCountryCodeSlot);
      handleDragEnd();
    }
  }

  function attemptSubmit() {
    setTargetMatchCountryCodeForAdd(null);

    let submissionCorrect = true;

    // For a correct submission, clear out previous incorrect submissions
    let incorrectSubmissions: Partial<Record<Cca3Code, Partial<Record<keyof StoredCountry, Cca3Code>>>>[] = [];

    // Submission is correct if all matched (non-blank) values are correct
    for (const countryCode of quizState.countryCodes) {
      const matchedCountryFields = quizState.matchedCountryFields[countryCode];

      if (!matchedCountryFields) {
        continue;
      }

      for (const [countryField, matchedCountryCode] of Object.entries(matchedCountryFields)) {
        const correctValue = getFieldReadableValue(storedCountryData, countryCode,
            countryField as keyof StoredCountry, !singleCapacity);
        const matchedValue = getFieldReadableValue(storedCountryData, matchedCountryCode,
            countryField as keyof StoredCountry, !singleCapacity);

        if (correctValue !== matchedValue) {
          submissionCorrect = false;
          break;
        }
      }
    }

    const newMatchedCountryFields = structuredClone(quizState.matchedCountryFields);
    let newLockedInCountryFields = structuredClone(quizState.countryFieldsLockedInAsCorrect);

    const submissionsRemaining = quizState.submissionsRemaining - 1;
    const screenReaderMessageParts: React.ReactNode[] = [];

    if (!submissionCorrect) {
      // Record the incorrect submission
      incorrectSubmissions = [...quizState.incorrectSubmissions,
          structuredClone(newMatchedCountryFields)];

      // Clear out any non-locked-in countries
      for (const [countryCode, countryFields] of Object.entries(quizState.matchedCountryFields)) {
        if (countryFields) {
          for (const countryField of Object.keys(countryFields)) {
            const keyField = countryField as keyof StoredCountry;

            if (newLockedInCountryFields[countryCode]?.includes(keyField)) {
              continue;
            } else {
              delete newMatchedCountryFields[countryCode]?.[keyField];
            }
          }
        }
      }

      // Briefly animate the matched lists shaking
      const matchedListElements = document.querySelectorAll('.draggable-country-pool.target-container');

      if (matchedListElements.length) {
        for (const matchedListElement of matchedListElements) {
          matchedListElement.classList.add('shake');
          setTimeout(() => matchedListElement.classList.remove('shake'), 500);
        }
      }

      // Sound effect..

      screenReaderMessageParts.push("Submission incorrect.");
    } else {
      screenReaderMessageParts.push("Submission correct and locked-in.");

      // Set the matched fields as locked in, only needing to
      // keep track of fields with values as an array
      newLockedInCountryFields = {};

      for (const countryCode of Object.keys(newMatchedCountryFields)) {
        if (newMatchedCountryFields[countryCode]) {
          newLockedInCountryFields[countryCode] =
              (Object.keys(newMatchedCountryFields[countryCode]) as (keyof StoredCountry)[])
              .filter(countryField => newMatchedCountryFields[countryCode]?.[countryField]);
        }
      }
    }

    screenReaderMessageParts.push(` ${submissionsRemaining} submission${
          submissionsRemaining === 1 ? "" : "s"} remaining.`);

    if (quizState.countryCodes.length === Object.values(newLockedInCountryFields).flat().length) {
      let infoLabel = "information";

      if (singleCapacity) {
        infoLabel = getPluralFieldLabel(quizState.countryFields[0], true);
      }

      if (quizState.level >= QUIZ_MAX_LEVEL && quizState.round >= QUIZ_ROUNDS_PER_LEVEL) {
        screenReaderMessageParts.push(` All country ${infoLabel} correctly sorted out. You beat the quiz!`);
      } else {
        screenReaderMessageParts.push(` All country ${infoLabel} correctly sorted out. Ready for the next round.`);
      }
    } else if (submissionsRemaining <= 0) {
      screenReaderMessageParts.push(` The quiz has ended on level ${quizState.level}, round ${quizState.round}.`);
    }

    announceForScreenReaders(<>{screenReaderMessageParts}</>);

    setQuizState({
      ...quizState,
      matchedCountryFields: newMatchedCountryFields,
      countryFieldsLockedInAsCorrect: newLockedInCountryFields,
      submissionsRemaining,
      incorrectSubmissions,
    });
  }

  function canSlotAcceptCountryCodeValue(countryField: keyof StoredCountry,
      countryCodeValue: Cca3Code, countryCodeSlot: Cca3Code, allowSwaps = true) {
    const countryCodeValueAtSlot = quizState.matchedCountryFields[countryCodeSlot]?.[countryField];

    if (countryCodeValueAtSlot) {
      if (getFieldReadableValue(storedCountryData, countryCodeValueAtSlot, countryField, !singleCapacity)
          === getFieldReadableValue(storedCountryData, countryCodeValue, countryField, !singleCapacity)) {
        // Occupied by the same value already
        return false;
      }

      if (allowSwaps) {
        if (quizState.countryFieldsLockedInAsCorrect[countryCodeSlot]?.includes(countryField)) {
          // Occupied by a locked-in value
          return false;
        }
      } else {
        // Occupied by a value
        return false;
      }
    }

    return true;
  }

  // Remove the country field country code value from the designated country code slot
  function onRemove(countryField: keyof StoredCountry, countryCodeSlot: Cca3Code) {
    const matchCountryFields = quizState.matchedCountryFields[countryCodeSlot];
    const matchedValue = matchCountryFields?.[countryField];

    if (!matchedValue) {
      return;
    }

    const newMatchedCountryFields = structuredClone(quizState.matchedCountryFields);
    delete newMatchedCountryFields[countryCodeSlot]?.[countryField];

    setMatchedCountryFields(newMatchedCountryFields);

    // Use the original label to avoid using the markup for flags
    announceForScreenReaders(<>{
      getFieldReadableValue(storedCountryData, matchedValue, countryField, !singleCapacity)
    } unmatched from {
      getCountryNameFromCode(countryCodeSlot, storedCountryData.countries)
    }.</>);
  }

  // Add to the designated country code slot if set,
  // or else to the first one with capacity.  If the provided country code slot
  // is occupied and not locked-in, swap with the new value.
  // If it is locked-in, do nothing. Also handles if dragged from another slot.
  function onAdd(countryField: keyof StoredCountry, countryCodeValue: Cca3Code,
      countryCodeSlot = targetMatchCountryCodeForAdd, fromSlot = selectedCountryCodeSlot) {
    if (countryCodeSlot && !canSlotAcceptCountryCodeValue(countryField, countryCodeValue, countryCodeSlot)) {
      return;
    }

    if (!countryCodeSlot) {
      // No designated slot, so find the first available slot.
      // Country codes come sorted by name already.
      for (const matchedCountryCode of quizState.countryCodes) {
        if (canSlotAcceptCountryCodeValue(countryField, countryCodeValue, matchedCountryCode, false)) {
          countryCodeSlot = matchedCountryCode;
          break;
        }
      }
    }

    const countryCodeValueAtSlot = countryCodeSlot ?
        quizState.matchedCountryFields[countryCodeSlot]?.[countryField] : undefined;

    if (countryCodeSlot && countryCodeValueAtSlot !== selectedCountryFieldCountryCode) {
      const newMatchedCountryFields = structuredClone(quizState.matchedCountryFields);
      let swappedValue: string | undefined;

      if (fromSlot && newMatchedCountryFields[fromSlot]) {
        if (countryCodeValueAtSlot) {
          // Set the occupying country value to the moving country value's slot
          newMatchedCountryFields[fromSlot] = {
            ...newMatchedCountryFields[fromSlot],
            [countryField]: countryCodeValueAtSlot,
          };

          swappedValue = getFieldReadableValue(storedCountryData, countryCodeValueAtSlot,
              countryField, !singleCapacity);
        } else {
          // Remove the moving country value from its current slot
          delete newMatchedCountryFields[fromSlot][countryField];
        }
      }

      // Set the country value to its new slot
      newMatchedCountryFields[countryCodeSlot] = {
        ...newMatchedCountryFields[countryCodeSlot],
        [countryField]: countryCodeValue,
      };

      setMatchedCountryFields(newMatchedCountryFields);

      announceForScreenReaders(<>{
        getFieldReadableValue(storedCountryData, countryCodeValue, countryField, !singleCapacity)
      } now matched to {
        getCountryNameFromCode(countryCodeSlot, storedCountryData.countries)
      }{
        swappedValue ? `, swapped with ${swappedValue}` : ""
      }.</>);
    }
  }

  // Move to previous slot in sorted order that has capacity,
  // looping around if the first one, and potentially swapping with any value in that slot
  function onMoveUp(countryField: keyof StoredCountry, fromSlot: Cca3Code) {
    const fromSlotIndex = quizState.countryCodes.indexOf(fromSlot);
    const countryCodeValue = quizState.matchedCountryFields[fromSlot]?.[countryField];

    if (fromSlotIndex < 0 || !countryCodeValue) {
      return;
    }

    let toSlotIndex = -1;

    for (let i = fromSlotIndex - 1; i !== fromSlotIndex; i--) {
      if (i < 0) {
        i = quizState.countryCodes.length;
        continue;
      }

      if (!canSlotAcceptCountryCodeValue(countryField, countryCodeValue, quizState.countryCodes[i])) {
        continue;
      }

      toSlotIndex = i;
      break;
    }

    if (toSlotIndex < 0) {
      announceForScreenReaders("No available slots to move to.");
      return;
    }

    const toSlotCountryCode = quizState.countryCodes[toSlotIndex];
    const newMatchedCountryFields = structuredClone(quizState.matchedCountryFields);
    newMatchedCountryFields[toSlotCountryCode] ??= {};
    const countryCodeValueAtToSlot = newMatchedCountryFields[toSlotCountryCode][countryField];
    let swappedValue: string | undefined;

    if (countryCodeValueAtToSlot) {
      // Set the occupying country value to the moving country value's slot
      newMatchedCountryFields[fromSlot] = {
        ...newMatchedCountryFields[fromSlot],
        [countryField]: countryCodeValueAtToSlot,
      };

      swappedValue = getFieldReadableValue(storedCountryData, countryCodeValueAtToSlot,
          countryField, !singleCapacity);
    } else {
      // Remove the moving country value from its current slot
      delete newMatchedCountryFields[fromSlot]?.[countryField];
    }

    // Set the country value to its new slot
    newMatchedCountryFields[quizState.countryCodes[toSlotIndex]] = {
      ...newMatchedCountryFields[toSlotCountryCode],
      [countryField]: countryCodeValue,
    };

    setMatchedCountryFields(newMatchedCountryFields);

    setTimeout(() => {
      const sortedMatched = getSortedMatchedCountryFields(storedCountryData, newMatchedCountryFields,
          !singleCapacity);
      const arrayIndex = Object.keys(sortedMatched[toSlotCountryCode] ?? {}).indexOf(countryField) ?? -1;

      if (arrayIndex >= 0) {
        // Maintain focus on the button for the value element after moving
        const moveUpButton = document.querySelectorAll(`.draggable-country-pool.target-container > ul > li:nth-child(${
          toSlotIndex + 1
        }) .move-up-button`)[arrayIndex];

        if (moveUpButton instanceof HTMLButtonElement) {
          moveUpButton.focus();
        }
      }
    });

    announceForScreenReaders(<>{
      getFieldReadableValue(storedCountryData, countryCodeValue, countryField, !singleCapacity)
    } moved up, now matched to {
      getCountryNameFromCode(toSlotCountryCode, storedCountryData.countries)
    }{
      swappedValue ? `, swapped with ${swappedValue}` : ""
    }.</>);
  }

  // Move to next slot in sorted order that has capacity,
  // looping around if the last one, and potentially swapping with any value in that slot
  function onMoveDown(countryField: keyof StoredCountry, fromSlot: Cca3Code) {
    const fromSlotIndex = quizState.countryCodes.indexOf(fromSlot);
    const countryCodeValue = quizState.matchedCountryFields[fromSlot]?.[countryField];

    if (fromSlotIndex < 0 || !countryCodeValue) {
      return;
    }

    let toSlotIndex = -1;

    for (let i = fromSlotIndex + 1; i !== fromSlotIndex; i++) {
      if (i >= quizState.countryCodes.length) {
        i = -1;
        continue;
      }

      if (!canSlotAcceptCountryCodeValue(countryField, countryCodeValue, quizState.countryCodes[i])) {
        continue;
      }

      toSlotIndex = i;
      break;
    }

    if (toSlotIndex < 0) {
      announceForScreenReaders("No available slots to move to.");
      return;
    }

    const toSlotCountryCode = quizState.countryCodes[toSlotIndex];
    const newMatchedCountryFields = structuredClone(quizState.matchedCountryFields);
    newMatchedCountryFields[toSlotCountryCode] ??= {};
    const countryCodeValueAtToSlot = newMatchedCountryFields[toSlotCountryCode][countryField];
    let swappedValue: string | undefined;

    if (countryCodeValueAtToSlot) {
      // Set the occupying country value to the moving country value's slot
      newMatchedCountryFields[fromSlot] = {
        ...newMatchedCountryFields[fromSlot],
        [countryField]: countryCodeValueAtToSlot,
      };

      swappedValue = getFieldReadableValue(storedCountryData, countryCodeValueAtToSlot,
          countryField, !singleCapacity);
    } else {
      // Remove the moving country value from its current slot
      delete newMatchedCountryFields[fromSlot]?.[countryField];
    }

    // Set the country value to its new slot
    newMatchedCountryFields[quizState.countryCodes[toSlotIndex]] = {
      ...newMatchedCountryFields[toSlotCountryCode],
      [countryField]: countryCodeValue,
    };

    setMatchedCountryFields(newMatchedCountryFields);

    setTimeout(() => {
      const sortedMatched = getSortedMatchedCountryFields(storedCountryData, newMatchedCountryFields,
          !singleCapacity);
      const arrayIndex = Object.keys(sortedMatched[toSlotCountryCode] ?? {}).indexOf(countryField) ?? -1;

      if (arrayIndex >= 0) {
        // Maintain focus on the button for the value element after moving
        const moveDownButton = document.querySelectorAll(`.draggable-country-pool.target-container > ul > li:nth-child(${
          toSlotIndex + 1
        }) .move-down-button`)[arrayIndex];

        if (moveDownButton instanceof HTMLButtonElement) {
          moveDownButton.focus();
        }
      }
    });

    announceForScreenReaders(<>{
      getFieldReadableValue(storedCountryData, countryCodeValue, countryField, !singleCapacity)
    } moved down, now matched to {
      getCountryNameFromCode(toSlotCountryCode, storedCountryData.countries)
    }{
      swappedValue ? `, swapped with ${swappedValue}` : ""
    }.</>);
  }

  return (
    (quizState.quiz.structure !== "sortingOut") ? null : <>
      <p className="sr-only" aria-live="polite">{srAnnouncement}</p>

      <div className="quiz-controls">
        <DraggableCountryPool headerId="unmatched-pool-header"
            headerText={`Country ${!singleCapacity ? "Info"
                : getPluralFieldLabel(quizState.countryFields[0])} to Sort Out`}
            emptyMessage={`All ${!singleCapacity ? "info has"
                : `${getPluralFieldLabel(quizState.countryFields[0], true)} have`} been sorted out`}
            selectedCountryCode={selectedCountryFieldCountryCode}
            onDrop={handleDropForUnmatchedFieldPool}>
          {(Object.keys(sortedUnmatchedValues) as (keyof StoredCountry)[]).map(countryField => (
            (sortedUnmatchedValues[countryField] ?? []).map(countryCode => (
              <li key={`${(countryField)}_${countryCode}`}>
                <DraggableCountry cca3={countryCode}
                    countryField={countryField}
                    showCountryFieldInLabel={!singleCapacity}
                    revealedValueLabel={getCountryNameFromCode(countryCode, storedCountryData.countries)}
                    isSelected={countryCode === selectedCountryFieldCountryCode
                        && countryField === selectedCountryField}
                    isDragged={countryCode === selectedCountryFieldCountryCode
                        && countryField === selectedCountryField
                        && isDraggingCountryField}
                    roundActive={roundActive}
                    quizActive={quizActive}
                    quizType={quizState.quiz.type}
                    onDragStart={(event) => handleDragStart(event, countryCode, countryField)}
                    onDragEnd={handleDragEnd}
                    onDrag={handleDrag}
                    onDrop={handleDropForUnmatchedFieldPool}
                    onAdd={() => onAdd(countryField, countryCode)} />
              </li>
            ))
          ))}
        </DraggableCountryPool>

        <DraggableCountryPool headerId="matched-pool-header"
            headerText={`Countries the ${!singleCapacity ?
                "Info Belongs" : `${getPluralFieldLabel(quizState.countryFields[0])} Belong`} to`}
            canBeDroppedIntoDirectly={false}
            isTargetContainer
            emptyMessage="Error">
          {quizState.countryCodes.map(countryCodeSlot => {
            const CountryWrapper = singleCapacity ? React.Fragment : 'li';
            let countryLabel: React.ReactNode =
                getCountryNameFromCode(countryCodeSlot, storedCountryData.countries);

            if (!roundActive) {
              countryLabel = <>{quizActive ? countryLabel
                  : <Link to={`/countries/${countryCodeSlot}`}>{countryLabel}</Link>} ({
                storedCountryData.countries[countryCodeSlot]?.data?.continents?.formattedValue ??
                    "Continents Unavailable"
              })</>;
            }

            const countryEntries =
                Object.entries(sortedMatchedCountryFields[countryCodeSlot] ?? {}) as [
                  keyof StoredCountry, Cca3Code
                ][];

            const worldFactbookKey =
                storedCountryData.countries[countryCodeSlot]?.data?.worldFactbookCountryKey;

            const contentBelowHeader = !roundActive && !quizState.countryFields.includes("location") ?
                <div className="content-below-header">
                  <div><CaptionedImageDialogButton
                      imageDescription="Country Location"
                      buttonLabelOverride="View Country Location"
                      src={worldFactbookKey ? getLocatorMapSrc(worldFactbookKey) : undefined}
                      caption={storedCountryData.countries[countryCodeSlot]?.data?.location ??
                          "The location of this country. No additional description available."}>
                    View Country Location
                  </CaptionedImageDialogButton></div>
                </div> : null;

            const canBeDroppedIntoDirectly = !!selectedCountryField
                && !quizState.countryFieldsLockedInAsCorrect[countryCodeSlot]?.includes(selectedCountryField);

            // Could use the country code as the key when available, so that focus
            // automatically remains on the country component's buttons when moved up/down,
            // but the key needs to be based on the slot in order to preserve image loading
            // and details collapse states, so need to handle focus manually...
            return (
              <li key={countryCodeSlot}>
                <DraggableCountryPool headerId={`matched-pool-header-${countryCodeSlot}`}
                    headerText={countryLabel}
                    headerLevel={3}
                    contentBelowHeader={contentBelowHeader}
                    singleCapacity={singleCapacity}
                    canBeDroppedIntoDirectly={canBeDroppedIntoDirectly}
                    emptyMessage={roundActive ? "Drag the correct information here" : ""}
                    selectedCountryCode={selectedCountryField}
                    isTargetForAdd={targetMatchCountryCodeForAdd === countryCodeSlot}
                    hideTargetForAddButton={singleCapacity
                        && !!countryEntries.length}
                    onTargetForAddToggle={roundActive && !(singleCapacity
                        && !!countryEntries.length) ?
                        () => setTargetMatchCountryCodeForAdd(countryCodeSlot === targetMatchCountryCodeForAdd ?
                            null : countryCodeSlot) : undefined}
                    onDrop={event => handleDropForMatchCountry(event, countryCodeSlot)}>
                  {countryEntries.length ? countryEntries.map(([countryField, countryFieldCountryCode]) => (
                    <CountryWrapper key={`${(countryField)}_${countryFieldCountryCode}`}>
                      <DraggableCountry cca3={countryFieldCountryCode}
                        countryField={countryField}
                        showCountryFieldInLabel={!singleCapacity}
                        isSelected={countryFieldCountryCode === selectedCountryFieldCountryCode
                            && countryField === selectedCountryField}
                        isDragged={countryFieldCountryCode === selectedCountryFieldCountryCode
                            && countryField === selectedCountryField
                            && isDraggingCountryField}
                        isLockedIn={quizState.countryFieldsLockedInAsCorrect[countryCodeSlot]
                            ?.includes(countryField)}
                        roundActive={roundActive}
                        quizActive={quizActive}
                        quizType={quizState.quiz.type}
                        onDragStart={(event) => handleDragStart(event,
                            countryFieldCountryCode, countryField, countryCodeSlot)}
                        onDragEnd={handleDragEnd}
                        onDrag={handleDrag}
                        onMoveUp={() => {onMoveUp(countryField, countryCodeSlot)}}
                        onMoveDown={() => {onMoveDown(countryField, countryCodeSlot)}}
                        onRemove={() => onRemove(countryField, countryCodeSlot)} />
                    </CountryWrapper>
                  )) : null}
                </DraggableCountryPool>
              </li>
            );
          })}
        </DraggableCountryPool>
      </div>

      {/* Reminder that you don't have to submit everything in one go TODO - verify this works */}
      {roundActive && !Object.keys(quizState.countryFieldsLockedInAsCorrect).length
          && !!quizState.incorrectSubmissions.length
          && Object.values(quizState.incorrectSubmissions[
              quizState.incorrectSubmissions.length - 1])
              .flatMap(valueObject => Object.values(valueObject ?? {})).length
              === quizState.countryCodes.length * quizState.countryFields.length
          && <p className="quiz-message" aria-live="polite">
        Remember: {QUIZ_ONE_GO_TIP}
      </p>}

      {numberOfLockedInCountryFields < quizState.countryCodes.length * quizState.countryFields.length
          && <QuizSubmitButton onSubmit={attemptSubmit}
        alreadyGuessed={alreadyGuessed}
        disabled={Object.values(quizState.matchedCountryFields)
            .flatMap(valueObject => Object.values(valueObject ?? {})).length <= numberOfLockedInCountryFields}
        submissionsRemaining={quizState.submissionsRemaining} />}
    </>
  );
}

export default QuizControlsForSortingOut;
