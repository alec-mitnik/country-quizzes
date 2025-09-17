import type { Cca3Code } from "@yusifaliyevpro/countries/types";
import React, { useState, type DragEvent } from "react";
import Button from "../Button";
import { CUSTOM_DRAG_TYPE } from "../utils/consts";

interface DraggableCountryPoolProps {
  headerId: string;
  headerText: React.ReactNode;
  headerLevel?: number;
  contentBelowHeader?: React.ReactNode;
  singleCapacity?: boolean;
  canBeDroppedIntoDirectly?: boolean;
  isTargetContainer?: boolean;
  emptyMessage: string;
  children: React.ReactNode;
  selectedCountryCode?: Cca3Code | null;
  isTargetForAdd?: boolean;
  onTargetForAddToggle?: () => void;
  onDrop?: (event: DragEvent) => void;
}

/**
 * Holds one or more unordered draggable countries, or nested pools for matching
 * @param {string} [props.headerId] ID of the header element
 * @param {React.ReactNode} [props.headerText] Text or markup to go inside the header element
 * @param {number} [props.headerLevel=2] Level of the header element
 * @param {React.ReactNode} [props.contentBelowHeader] Optional content to display below the header
 * @param {boolean} [props.singleCapacity=false] If true, only one country
 * can be stored in the pool at a time
 * @param {boolean} [props.canBeDroppedIntoDirectly=true] If false, is at capacity,
 * or countries are expected to be dropped into nested child pools
 * @param {boolean} [props.isTargetContainer=false] If true, is styled with a light border
 * and plays a shaking animation on incorrect submission
 * @param {string} [props.emptyMessage] Message to display when the pool is empty
 * @param {React.ReactNode} props.children Draggable country components held by the pool
 * @param {Cca3Code | null} [props.selectedCountryCode] The code of the currently selected/dragged country
 * @param {boolean} [props.isTargetForAdd=false] Whether the pool is the target for adding
 * @param {function} [props.onTargetForAddToggle] Function to call when the pool is set as the target for adding
 * @param {function} [props.onDrop] Function to call when a draggable country is dropped onto the pool
 */
function DraggableCountryPool({ headerId, headerText, headerLevel = 2, contentBelowHeader,
    singleCapacity = false, canBeDroppedIntoDirectly = true, isTargetContainer = false,
    emptyMessage, children, selectedCountryCode, isTargetForAdd = false, onTargetForAddToggle,
    onDrop }: DraggableCountryPoolProps) {
  const [isBeingDraggedOver, setIsBeingDraggedOver] = useState(false);

  function handleDragOver(event: DragEvent) {
    if (event.dataTransfer.types.every(type => type === CUSTOM_DRAG_TYPE)
        && canBeDroppedIntoDirectly) {
      event.preventDefault();
    }

    if (isBeingDraggedOver && !selectedCountryCode) {
      setIsBeingDraggedOver(false);
    }
  }

  function handleDragEnter(event: DragEvent) {
    if (event.dataTransfer.types.every(type => type === CUSTOM_DRAG_TYPE)
        && canBeDroppedIntoDirectly && selectedCountryCode) {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';

      // Allow for child triggers in case the drag originated from inside the container,
      // or the container's entrance event isn't triggered due to fast movement
      // and large overlap with children
      if (!isBeingDraggedOver) {
        setIsBeingDraggedOver(true);
      }
    } else {
      event.dataTransfer.dropEffect = 'none';
    }
  }

  function handleDragLeave(event: DragEvent) {
    // Only care about leaving the actual container, not any of the children
    const isPool = event.target instanceof HTMLElement
        && event.target.matches('.draggable-country-pool');

    if (isPool
        && event.dataTransfer.types.every(type => type === CUSTOM_DRAG_TYPE)
        && canBeDroppedIntoDirectly) {
      event.preventDefault();
      setIsBeingDraggedOver(false);
    }
  }

  // Doesn't fire if the drag involves no actual movement!
  function handleDrop(event: DragEvent) {
    if (event.dataTransfer.types.every(type => type === CUSTOM_DRAG_TYPE)
        && canBeDroppedIntoDirectly) {
      event.preventDefault();
      event.stopPropagation();
      setIsBeingDraggedOver(false);

      if (onDrop) {
        onDrop(event);
      }
    }
  }

  function handleDragEnd() {
    setIsBeingDraggedOver(false);
  }

  const ComponentWrapper = singleCapacity ? 'div' : 'section';
  const ChildrenWrapper = singleCapacity ? React.Fragment : 'ul';

  // eslint-disable-next-line react-x/no-children-count
  const hasChildren = React.Children.count(children);

  // The period at the end of the aria-label adds a helpful pause
  // before the word "button" is spoken
  const targetForAddButton: React.ReactNode = onTargetForAddToggle ? <Button type="button"
    onClick={() => onTargetForAddToggle()}
    aria-label={isTargetForAdd ? "Stop targeting this value." : "Target this value for adding."}
    className="target-for-add-button">
      <span aria-hidden="true" className="symbol-font">⌖</span>
  </Button> : null;

  const headerTextWithOffset = <>{targetForAddButton}{headerText}</>

  return <ComponentWrapper className={`draggable-country-pool${isBeingDraggedOver ? " being-dragged-over" : ""
      }${isTargetContainer ? " target-container" : ""}${isTargetForAdd ? " target-for-add" : ""}`}
      aria-labelledby={headerId}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onDragEnd={handleDragEnd}>
    {targetForAddButton}

    {headerLevel === 0 && <div id={headerId}>{headerText}</div>}
    {headerLevel === 1 && <h1 id={headerId}>{headerTextWithOffset}</h1>}
    {headerLevel === 2 && <h2 id={headerId}>{headerTextWithOffset}</h2>}
    {headerLevel === 3 && <h3 id={headerId}>{headerTextWithOffset}</h3>}
    {headerLevel === 4 && <h4 id={headerId}>{headerTextWithOffset}</h4>}
    {headerLevel === 5 && <h5 id={headerId}>{headerTextWithOffset}</h5>}
    {headerLevel === 6 && <h6 id={headerId}>{headerTextWithOffset}</h6>}

    {contentBelowHeader}

    {hasChildren ? (<ChildrenWrapper>
      {children}
    </ChildrenWrapper>) : (!!emptyMessage && <p>{emptyMessage}</p>)}
  </ComponentWrapper>
}

export default DraggableCountryPool;
