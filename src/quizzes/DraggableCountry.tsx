import type { Cca3Code } from "@yusifaliyevpro/countries/types";
import { useRef, type DragEvent } from "react";
import { Link } from "react-router-dom";
import CaptionedImageDialogButton from "../CaptionedImageDialogButton";
import useCountries from "../hooks/useCountries";
import type { QuizTypeKey } from "../pages/Quiz";
import { getLocatorMapSrc } from "../utils/utils";

interface DraggableCountryProps {
  cca3: Cca3Code;
  rankIndex?: number;
  revealedValueLabel?: React.ReactNode;
  isSelected: boolean;
  isDragged: boolean;
  isLockedIn?: boolean;
  roundActive: boolean;
  quizActive: boolean;
  quizTypeKey: QuizTypeKey;
  countryCodeBeingDraggedOver?: Cca3Code | null;
  onDragStart: (event: DragEvent<HTMLDivElement>, cca3: Cca3Code) => void;
  onDragEnd: () => void;
  onDrag?: (event: DragEvent<HTMLDivElement>) => void;
  onDragEnter?: (event: DragEvent) => void;
  onDragOver?: (event: DragEvent) => void;
  onDragLeave?: (event: DragEvent) => void;
  onDrop?: (event: DragEvent, itemCountryCode: Cca3Code) => void;
  onRemove?: () => void;
  onAdd?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

/**
 * Draggable element with alternative controls representing a country to be matched or ranked
 * @param {Cca3Code} [props.cca3] The country code of the country being represented
 * @param {number} [props.rankIndex] The current rank of the country if in a ranked list
 * @param {React.ReactNode} [props.revealedValueLabel] What to display when the correct value is to be revealed
 * @param {boolean} [props.isSelected] Whether the country is currently selected
 * @param {boolean} [props.isDragged] Whether the country is currently being dragged
 * @param {boolean} [props.isLockedIn] Whether the country is locked in as correct and cannot be moved
 * @param {boolean} [props.roundActive] Whether the quiz round is currently active
 * @param {boolean} [props.quizActive] Whether the quiz is currently active
 * @param {QuizTypeKey} [props.quizTypeKey] The key of the type of the quiz
 * @param {Cca3Code} [props.countryCodeBeingDraggedOver] The country code of the country being dragged over, if any
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
function DraggableCountry({cca3, rankIndex, revealedValueLabel, isSelected,
    isDragged, isLockedIn = false, roundActive, quizActive, quizTypeKey, countryCodeBeingDraggedOver,
    onDragStart, onDragEnd, onDrag, onDragEnter, onDragOver, onDragLeave,
    onDrop, onRemove, onAdd, onMoveUp, onMoveDown}: DraggableCountryProps) {
  const elementRef = useRef<HTMLDivElement>(null);
  const { storedCountryData } = useCountries();

  // For easy testing
  // roundActive = false;
  // quizActive = false;

  const showRank = rankIndex != null && !isNaN(rankIndex);
  const countryName = storedCountryData.countries[cca3]?.data?.name ?? cca3;

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
        countryCodeBeingDraggedOver === cca3 && !isDragged ? " being-dragged-over" : ""}`}
        draggable={roundActive && !isLockedIn} onDragEnd={onDragEnd}
        onDragStart={(event) => onDragStart(event, cca3)}
        onDrag={handleDrag}
        onDragEnter={onDrop ? handleDragEnter : undefined}
        onDragLeave={onDrop ? handleDragLeave : undefined}
        onDragOver={onDrop ? handleDragOver : undefined}
        onDrop={onDrop ? event => onDrop(event, cca3) : undefined}>
      <div aria-description={isLockedIn ? "Locked in." : ""}>
        {/* Cannot go after the text content or wrapped text will push it down */}
        <span className="button-controls">
          {/* Putting the symbol font on a span rather than the button directly
          preserves height better, so do it for all the buttons, for consistency */}
          {roundActive && onMoveUp && !isLockedIn && <button type="button"
              className="move-up-button" aria-label={`Move ${countryName} up.`}
              onClick={onMoveUp}>
            <span aria-hidden="true" className="symbol-font">🠝</span>
          </button>}

          {roundActive && onMoveDown && !isLockedIn && <button type="button"
              className="move-down-button" aria-label={`Move ${countryName} down.`}
              onClick={onMoveDown}>
            <span aria-hidden="true" className="symbol-font">🠟</span>
          </button>}

          {roundActive && onRemove && !isLockedIn && <button type="button"
              className="remove-button" aria-label={`Remove ${countryName}.`} onClick={onRemove}>
            <span aria-hidden="true" className="symbol-font">🞥</span>
          </button>}

          {roundActive && onAdd && <button type="button" className="add-button"
              aria-label={`Add ${countryName}.`} onClick={onAdd}>
            <span aria-hidden="true" className="symbol-font">🞥</span>
          </button>}
        </span>

        <span aria-hidden="true" className="symbol-wrapper">
          <span className="check-mark">✓</span>
          <span className="grip">{roundActive ? "⋮⋮" : "✗"}</span> &nbsp;
        </span>

        {showRank && `${rankIndex + 1}. `}{
          quizActive ? countryName : <Link to={`/countries/${cca3}`}>{countryName}</Link>
        }{roundActive ? "" : <> ({
          storedCountryData.countries[cca3]?.data?.continents?.formattedValue ?? "Continents Unavailable"
        }){revealedValueLabel && <>: {revealedValueLabel}</>}
          {quizTypeKey !== "MATCH_TO_LOCATIONS" && <div><CaptionedImageDialogButton
              imageDescription="Country Location"
              src={key ? getLocatorMapSrc(key) : undefined}
              caption={storedCountryData.countries[cca3]?.data?.location ??
                  "The location of this country. No additional description available."}>
            View Location
          </CaptionedImageDialogButton></div>}
        </>}
      </div>
    </div>
  );
}

export default DraggableCountry;
