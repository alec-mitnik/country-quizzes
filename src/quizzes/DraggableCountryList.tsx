import type { Cca3Code } from "@yusifaliyevpro/countries/types";
import React, { useState, type DragEvent } from "react";
import { CUSTOM_DRAG_TYPE } from "../utils/consts";

interface DraggableCountryListProps {
  headerId: string;
  headerText: React.ReactNode;
  headerLevel?: number;
  emptyMessage: string
  children: React.ReactNode;
  selectedCountryCode?: Cca3Code | null;
  onDrop?: (event: DragEvent) => void;
}

/**
 * Holds draggable countries in an ordered list that can be rearranged
 * @param {string} [props.headerId] ID of the header element
 * @param {React.ReactNode} [props.headerText] Text or markup to go inside the header element
 * @param {number} [props.headerLevel=2] Level of the header element
 * @param {string} [props.emptyMessage] Message to display when the list is empty
 * @param {React.ReactNode} props.children Draggable country components held by the list
 * @param {Cca3Code | null} [props.selectedCountryCode] The code of the currently selected/dragged country
 * @param {function} [props.onDrop] Function to call when a draggable country is dropped onto the list
 */
function DraggableCountryList({ headerId, headerText, headerLevel = 2,
    emptyMessage, children, selectedCountryCode, onDrop }: DraggableCountryListProps) {
  const [isBeingDraggedOver, setIsBeingDraggedOver] = useState(false);

  function handleDragOver(event: DragEvent) {
    if (event.dataTransfer.types.every(type => type === CUSTOM_DRAG_TYPE)) {
      event.preventDefault();
    }

    if (isBeingDraggedOver && !selectedCountryCode) {
      setIsBeingDraggedOver(false);
    }
  }

  function handleDragEnter(event: DragEvent) {
    // Because the isBeingDraggedOverState is used to show the bottom drop border for the list,
    // and because propagation is stopped when dropping on a ranked item,
    // only treat the list as being dragged over when not dragging over any of its ranked children
    const isRankedList = event.target instanceof HTMLElement
        && event.target.matches('.draggable-country-list, .draggable-country-list h2');

    if (isRankedList && selectedCountryCode
        && event.dataTransfer.types.every(type => type === CUSTOM_DRAG_TYPE)) {
      event.preventDefault();
      setIsBeingDraggedOver(true);
      event.dataTransfer.dropEffect = 'move';
    } else {
      event.dataTransfer.dropEffect = 'none';
    }
  }

  function handleDragLeave(event: DragEvent) {
    // Only care about leaving the actual container, not any of the children
    const isRankedList = event.target instanceof HTMLElement
        && event.target.matches('.draggable-country-list');

    if (isRankedList
        && event.dataTransfer.types.every(type => type === CUSTOM_DRAG_TYPE)) {
      event.preventDefault();
      setIsBeingDraggedOver(false);
    }
  }

  // Doesn't fire if the drag involves no actual movement!
  function handleDrop(event: DragEvent) {
    if (event.dataTransfer.types.every(type => type === CUSTOM_DRAG_TYPE)) {
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

  // eslint-disable-next-line react-x/no-children-count
  const hasChildren = React.Children.count(children);

  return <section className={`draggable-country-list${isBeingDraggedOver ? " being-dragged-over" : ""}`}
      aria-labelledby={headerId}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onDragEnd={handleDragEnd}>
    {headerLevel === 1 && <h1 id={headerId}>{headerText}</h1>}
    {headerLevel === 2 && <h2 id={headerId}>{headerText}</h2>}
    {headerLevel === 3 && <h3 id={headerId}>{headerText}</h3>}
    {headerLevel === 4 && <h4 id={headerId}>{headerText}</h4>}
    {headerLevel === 5 && <h5 id={headerId}>{headerText}</h5>}
    {headerLevel === 6 && <h6 id={headerId}>{headerText}</h6>}

    {hasChildren ? (<ol>
      {children}
    </ol>) : (!!emptyMessage && <p>{emptyMessage}</p>)}
  </section>
}

export default DraggableCountryList;
