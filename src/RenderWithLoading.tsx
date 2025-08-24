import { useEffect, useState } from "react";
import type { JSX } from "react/jsx-runtime";
import "./RenderWithLoading.css";
import { LOADING_MESSAGE } from "./utils/consts";

interface RenderWithLoadingProps {
  loaded: boolean;
  error: null | string;
  dataExists?: boolean;
  noDataMessage?: string;
  focusOnLoad?: string;
  children: JSX.Element;
}

/**
 * Renders loading and error messages according to the provided statuses,
 * and renders the children content when loaded with data and no error
 * @param {boolean} [props.loaded] - Whether the data has been loaded
 * @param {null | string} [props.error] - The error message, if any
 * @param {boolean} [props.dataExists=true] - Whether the data exists
 * @param {string} [props.noDataMessage] - The no data message, if any
 * @param {string} [props.focusOnLoad] - Optional ID of the element to focus on load
 * @param {JSX.Element} [props.children] - The content to render when loaded with no error
 */
function RenderWithLoading({ loaded, error, dataExists = true,
    noDataMessage, focusOnLoad, children }: RenderWithLoadingProps) {
  const [readyForLoad, setReadyForLoad] = useState(false);
  const [handledLoad, setHandledLoad] = useState(false);

  useEffect(() => {
    if (readyForLoad && !handledLoad) {
      if (focusOnLoad) {
        document.getElementById(focusOnLoad)?.focus();
      }

      // Allow time for the 0 opacity style to be applied to fade in from
      setTimeout(() => setHandledLoad(true));
    }
  }, [readyForLoad, handledLoad, focusOnLoad]);

  function resetLoadStates() {
    if (readyForLoad) {
      setReadyForLoad(false);
    }

    if (handledLoad) {
      setHandledLoad(false);
    }
  }

  function renderContent() {
    if (error) {
      resetLoadStates();
      return <p className="error">{error}</p>;
    } else if (!loaded) {
      resetLoadStates();
      return <p className="loading">{LOADING_MESSAGE}</p>;
    } else if (!dataExists && noDataMessage) {
      // Kept separate in case we ever want to style it differently from other errors
      resetLoadStates();
      return <p className="error">{noDataMessage}</p>;
    } else {
      if (!readyForLoad && !handledLoad) {
        setReadyForLoad(true);
      }

      return children;
    }
  }

  return <div className={`render-with-loading-component component-wrapper${
      readyForLoad && !handledLoad ? " ready-for-load" : ""}`}>
    {renderContent()}
  </div>;
}

export default RenderWithLoading;
