import type { JSX } from "react/jsx-runtime";
import { LOADING_MESSAGE } from "./consts";

interface RenderWithLoadingProps {
  loaded: boolean;
  error: null | string;
  dataExists: boolean;
  noDataMessage: string;
  children: JSX.Element;
}

function RenderWithLoading({ loaded, error, dataExists,
    noDataMessage, children }: RenderWithLoadingProps) {
  if (!loaded) {
    return <p className="loading">{LOADING_MESSAGE}</p>;
  } else if (error) {
    return <p className="error">{error}</p>;
  } else if (!dataExists) {
    // Kept separate in case we ever want to style it differently from other errors
    return <p className="error">{noDataMessage}</p>;
  } else {
    return children;
  }
}

export default RenderWithLoading;
