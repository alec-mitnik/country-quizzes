import type { Cca3Code } from "@yusifaliyevpro/countries/types";
import { useMemo, useRef, type DragEvent } from "react";
import { Link } from "react-router-dom";
import type { StoredCountry } from "../../types/commonTypes";
import Button from "../Button";
import CaptionedImageDialogButton from "../CaptionedImageDialogButton";
import useCountries from "../hooks/useCountries";
import { getCountryNameFromCode, getFieldLabel, getFieldReadableValue } from "../utils/countryUtils";
import { getLocatorMapSrc } from "../utils/utils";
import CountryFieldDisplayValue from "./CountryFieldDisplayValue";
import type { QuizType } from "./quizConfig";

interface DraggableCountryProps {
  cca3: Cca3Code;
  countryField?: keyof StoredCountry;
  showCountryFieldInLabel?: boolean;
  rankIndex?: number;
  revealedValueLabel?: React.ReactNode;
  isSelected: boolean;
  isDragged: boolean;
  isLockedIn?: boolean;
  roundActive: boolean;
  quizActive: boolean;
  quizType: QuizType;
  countryCodeBeingDraggedOver?: Cca3Code | null;
  countryFieldBeingDraggedOver?: keyof StoredCountry | null;
  onDragStart: (event: DragEvent<HTMLDivElement>, cca3: Cca3Code, countryField? : keyof StoredCountry) => void;
  onDragEnd: () => void;
  onDrag?: (event: DragEvent<HTMLDivElement>) => void;
  onDragEnter?: (event: DragEvent) => void;
  onDragOver?: (event: DragEvent) => void;
  onDragLeave?: (event: DragEvent) => void;
  onDrop?: (event: DragEvent, itemCountryCode: Cca3Code, countryField?: keyof StoredCountry) => void;
  onRemove?: () => void;
  onAdd?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

/**
 * Draggable element with alternative controls representing a country to be matched or ranked
 * @param {Cca3Code} [props.cca3] The country code of the country being represented
 * @param {string} [props.countryField] The field of the country being represented, if applicable
 * @param {boolean} [props.showCountryFieldInLabel] Whether to show the country field in the label
 * @param {number} [props.rankIndex] The current rank of the country if in a ranked list
 * @param {React.ReactNode} [props.revealedValueLabel] What to display when the correct value is to be revealed
 * @param {boolean} [props.isSelected] Whether the country is currently selected
 * @param {boolean} [props.isDragged] Whether the country is currently being dragged
 * @param {boolean} [props.isLockedIn] Whether the country is locked in as correct and cannot be moved
 * @param {boolean} [props.roundActive] Whether the quiz round is currently active
 * @param {boolean} [props.quizActive] Whether the quiz is currently active
 * @param {QuizType} [props.quizType] The type of the quiz
 * @param {Cca3Code} [props.countryCodeBeingDraggedOver] The country code of the country being dragged over, if any
 * @param {string} [props.countryFieldBeingDraggedOver] The field of the country being dragged over, if any
 * @param {function} [props.onDragStart] Function to call when the country is dragged
 * @param {function} [props.onDragEnd] Function to call when the country is dropped
 * @param {function} [props.onDrag] Function to call when the country is dragged
 * @param {function} [props.onDragEnter] Function to call when the country is dragged into
 * @param {function} [props.onDragOver] Function to call when the country is dragged over
 * @param {function} [props.onDragLeave] Function to call when the country is dragged out of
 * @param {function} [props.onDrop] Function to call when the country is dropped onto
 * @param {function} [props.onRemove] Function to call when the remove control is activated
 * @param {function} [props.onAdd] Function to call when the add control is activated
 * @param {function} [props.onMoveUp] Function to call when the move up control is activated
 * @param {function} [props.onMoveDown] Function to call when the move down control is activated
 */
function DraggableCountry({cca3, countryField, showCountryFieldInLabel = false, rankIndex,
    revealedValueLabel, isSelected, isDragged, isLockedIn = false, roundActive, quizActive,
    quizType, countryCodeBeingDraggedOver, countryFieldBeingDraggedOver, onDragStart, onDragEnd,
    onDrag, onDragEnter, onDragOver, onDragLeave, onDrop, onRemove, onAdd, onMoveUp, onMoveDown
    }: DraggableCountryProps) {
  const elementRef = useRef<HTMLDivElement>(null);
  const { storedCountryData } = useCountries();

  // For easy testing
  // roundActive = false;
  // quizActive = false;

  const showRank = rankIndex != null && !isNaN(rankIndex);
  const countryName = getCountryNameFromCode(cca3, storedCountryData.countries);

  const countryReadableValue = useMemo(() => {
    if (countryField) {
      return `${showCountryFieldInLabel ? `${getFieldLabel(storedCountryData, cca3, countryField)}: ` : ''
        }${getFieldReadableValue(storedCountryData, cca3, countryField)}`;
    }

    return countryName;
  }, [countryField, countryName, showCountryFieldInLabel, storedCountryData, cca3]);

  const countryDisplayValue: React.ReactNode = useMemo(() => {
    if (countryField) {
      return <>{showCountryFieldInLabel && <>{getFieldLabel(storedCountryData, cca3, countryField)}: </>
          }<CountryFieldDisplayValue cca3={cca3} field={countryField} /></>;
    }

    return countryName;
  }, [countryField, countryName, showCountryFieldInLabel, storedCountryData, cca3]);

  function handleDrag(event: DragEvent<HTMLDivElement>) {
    if (onDrag) {
      onDrag(event);
    }
  }

  function handleDragEnter(event: DragEvent) {
    if (onDragEnter) {
      onDragEnter(event);
    }
  }

  function handleDragOver(event: DragEvent) {
    if (onDragOver) {
      onDragOver(event);
    }
  }

  function handleDragLeave(event: DragEvent) {
    if (onDragLeave) {
      onDragLeave(event);
    }
  }

  const key = storedCountryData.countries[cca3]?.data?.worldFactbookCountryKey;

  return (
    <div ref={elementRef} className={`draggable-country${isSelected ? " selected" : ""}${
        isDragged ? " dragged" : ""}${isLockedIn ? " locked-in" : ""}${
          countryCodeBeingDraggedOver === cca3
          && (!countryFieldBeingDraggedOver || countryFieldBeingDraggedOver === countryField)
          && !isDragged ? " being-dragged-over" : ""
        }`}
        draggable={roundActive && !isLockedIn} onDragEnd={onDragEnd}
        onDragStart={(event) => onDragStart(event, cca3, countryField)}
        onDrag={handleDrag}
        onDragEnter={onDrop ? handleDragEnter : undefined}
        onDragLeave={onDrop ? handleDragLeave : undefined}
        onDragOver={onDrop ? handleDragOver : undefined}
        onDrop={onDrop ? event => onDrop(event, cca3, countryField) : undefined}>
      <div aria-description={isLockedIn ? "Locked in." : ""}>
        {/* Cannot go after the text content or wrapped text will push it down */}
        <span className="button-controls">
          {/* Putting the symbol font on a span rather than the button directly
          preserves height better, so do it for all the buttons, for consistency */}
          {roundActive && onMoveUp && !isLockedIn && <Button type="button"
              className="move-up-button" aria-label={`Move ${countryReadableValue} up.`}
              onClick={onMoveUp}>
            <span aria-hidden="true" className="symbol-font">🠝</span>
          </Button>}

          {roundActive && onMoveDown && !isLockedIn && <Button type="button"
              className="move-down-button" aria-label={`Move ${countryReadableValue} down.`}
              onClick={onMoveDown}>
            <span aria-hidden="true" className="symbol-font">🠟</span>
          </Button>}

          {roundActive && onRemove && !isLockedIn && <Button type="button"
              className="remove-button" aria-label={`Remove ${countryReadableValue}.`} onClick={onRemove}>
            <span aria-hidden="true" className="symbol-font">🞥</span>
          </Button>}

          {/* The period at the end of the aria-label adds a helpful pause
          before the word "button" is spoken */}
          {roundActive && onAdd && <Button type="button" className="add-button"
              aria-label={`Add ${countryReadableValue}.`} onClick={onAdd}>
            <span aria-hidden="true" className="symbol-font">🞥</span>
          </Button>}
        </span>

        <span aria-hidden="true" className="symbol-wrapper">
          <span className="check-mark">✓</span>
          <span className="grip">{roundActive ? "⋮⋮" : "✗"}</span> &nbsp;
        </span>

        {showRank && `${rankIndex + 1}. `}{
          quizActive || quizType === "MATCH_TO_BORDERING_COUNTRIES" || countryField ?
              countryDisplayValue : <Link to={`/countries/${cca3}`}>{countryName}</Link>
        }{!roundActive && quizType !== "MATCH_TO_BORDERING_COUNTRIES" && !countryField && <> ({
          storedCountryData.countries[cca3]?.data?.continents?.formattedValue ?? "Continents Unavailable"
        })</>}{(!roundActive || isLockedIn) && !!revealedValueLabel
            // NVDA screen reader doesn't read or pause on the arrow...
            && <> <span className="symbol-font">🡒</span> {revealedValueLabel}</>}

        {!roundActive && quizType !== "MATCH_TO_LOCATIONS"
            && quizType !== "MATCH_TO_BORDERING_COUNTRIES"
            && !countryField
            && <div><CaptionedImageDialogButton
                imageDescription="Country Location"
                buttonLabelOverride="View Country Location"
                src={key ? getLocatorMapSrc(key) : undefined}
                caption={storedCountryData.countries[cca3]?.data?.location ??
                    "The location of this country. No additional description available."}>
          View Country Location
        </CaptionedImageDialogButton></div>}
      </div>
    </div>
  );
}

export default DraggableCountry;
