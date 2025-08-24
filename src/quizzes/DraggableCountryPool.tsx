import React, { useState, type DragEvent } from "react";
import { CUSTOM_DRAG_TYPE } from "../utils/consts";

interface DraggableCountryPoolProps {
  headerId: string;
  headerText: React.ReactNode;
  headerLevel?: number;
  singleCapacity?: boolean;
  canBeDroppedIntoDirectly?: boolean;
  isTargetContainer?: boolean;
  emptyMessage: string;
  children: React.ReactNode;
  onDrop?: (event: DragEvent) => void;
}

/**
 * Holds one or more unordered draggable countries, or nested pools for matching
 * @param {string} [props.headerId] ID of the header element
 * @param {React.ReactNode} [props.headerText] Text or markup to go inside the header element
 * @param {number} [props.headerLevel=2] Level of the header element
 * @param {boolean} [props.singleCapacity=false] If true, only one country
 * can be stored in the pool at a time
 * @param {boolean} [props.canBeDroppedIntoDirectly=true] If false,
 * countries are expected to be dropped into nested child pools
 * @param {boolean} [props.isTargetContainer=false] If true, is styled with a light border
 * and plays a shaking animation on incorrect submission
 * @param {string} [props.emptyMessage] Message to display when the pool is empty
 * @param {React.ReactNode} props.children Draggable country components held by the pool
 * @param {function} [props.onDrop] Function to call when a draggable country is dropped onto the pool
 */
function DraggableCountryPool({ headerId, headerText, headerLevel = 2,
    singleCapacity = false, canBeDroppedIntoDirectly = true, isTargetContainer = false,
    emptyMessage, children, onDrop }: DraggableCountryPoolProps) {
  const [isBeingDraggedOver, setIsBeingDraggedOver] = useState(false);

  function handleDragOver(event: DragEvent) {
    if (event.dataTransfer.types.every(type => type === CUSTOM_DRAG_TYPE)
        && canBeDroppedIntoDirectly) {
      event.preventDefault();
    }
  }

  function handleDragEnter(event: DragEvent) {
    if (event.dataTransfer.types.every(type => type === CUSTOM_DRAG_TYPE)
        && canBeDroppedIntoDirectly) {
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

  const ComponentWrapper = singleCapacity ? 'div' : 'section';
  const ChildrenWrapper = singleCapacity ? React.Fragment : 'ul';

  // eslint-disable-next-line react-x/no-children-count
  const hasChildren = React.Children.count(children);

  return <ComponentWrapper className={`draggable-country-pool${isBeingDraggedOver ? " being-dragged-over" : ""
      }${isTargetContainer ? " target-container" : ""}`}
      aria-labelledby={headerId}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}>
    {headerLevel === 0 && <div id={headerId}>{headerText}</div>}
    {headerLevel === 1 && <h1 id={headerId}>{headerText}</h1>}
    {headerLevel === 2 && <h2 id={headerId}>{headerText}</h2>}
    {headerLevel === 3 && <h3 id={headerId}>{headerText}</h3>}
    {headerLevel === 4 && <h4 id={headerId}>{headerText}</h4>}
    {headerLevel === 5 && <h5 id={headerId}>{headerText}</h5>}
    {headerLevel === 6 && <h6 id={headerId}>{headerText}</h6>}

    {hasChildren ? (<ChildrenWrapper>
      {children}
    </ChildrenWrapper>) : (!!emptyMessage && <p>{emptyMessage}</p>)}
  </ComponentWrapper>
}

export default DraggableCountryPool;
