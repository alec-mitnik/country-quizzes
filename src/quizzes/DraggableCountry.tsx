import type { Cca3Code } from "@yusifaliyevpro/countries/types";
import { useRef, type DragEvent } from "react";
import { Link } from "react-router-dom";
import useCountries from "../hooks/useCountries";

interface DraggableCountryProps {
  cca3: Cca3Code;
  rankIndex?: number;
  revealedValueLabel?: React.ReactNode;
  isSelected: boolean;
  isDragged: boolean;
  isLockedIn?: boolean;
  roundActive: boolean;
  quizActive: boolean;
  countryCodeBeingDraggedOver?: Cca3Code | null;
  onDragStart: (event: DragEvent<HTMLDivElement>, cca3: Cca3Code) => void;
  onDragEnd: () => void;
  onDragEnter?: (event: DragEvent) => void;
  onDragOver?: (event: DragEvent) => void;
  onDragLeave?: (event: DragEvent) => void;
  onDrop?: (event: DragEvent, itemCountryCode: Cca3Code) => void;
  onRemove?: () => void;
  onAdd?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

// Render a country's capital(s) for matching in a quiz
function DraggableCountry({cca3, rankIndex, revealedValueLabel, isSelected,
    isDragged, isLockedIn = false, roundActive, quizActive, countryCodeBeingDraggedOver,
    onDragStart, onDragEnd, onDragEnter, onDragOver, onDragLeave,
    onDrop, onRemove, onAdd, onMoveUp, onMoveDown}: DraggableCountryProps) {
  const elementRef = useRef<HTMLDivElement>(null);
  const { storedCountryData } = useCountries();

  // For easy testing
  // roundActive = false;
  // quizActive = false;

  const showRank = rankIndex != null && !isNaN(rankIndex);
  const countryName = storedCountryData.countries[cca3]?.data?.name ?? cca3;

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

  return (
    <div ref={elementRef} className={`draggable-country${isSelected ? " selected" : ""}${
        isDragged ? " dragged" : ""}${isLockedIn ? " locked-in" : ""}${
        countryCodeBeingDraggedOver === cca3 && !isDragged ? " being-dragged-over" : ""}`}
        draggable={roundActive && !isLockedIn} onDragEnd={onDragEnd}
        onDragStart={(event) => onDragStart(event, cca3)}
        onDragEnter={onDrop ? handleDragEnter : undefined}
        onDragLeave={onDrop ? handleDragLeave : undefined}
        onDragOver={onDrop ? handleDragOver : undefined}
        onDrop={onDrop ? event => onDrop(event, cca3) : undefined}>
      <p aria-description={isLockedIn ? "Locked in." : ""}>
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
        }){revealedValueLabel && <>: {revealedValueLabel}</>}</>}
      </p>
    </div>
  );
}

export default DraggableCountry;
