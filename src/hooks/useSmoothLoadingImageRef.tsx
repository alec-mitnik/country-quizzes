import { useEffect, useRef, useState } from "react";
import useStateRef from "./useStateRef";

/**
 * A hook for providing the loading and error statuses for an image element
 * (as class names) for easy smooth loading implementations
 * @param dependencies Any additions for the useEffect dependency array
 * to be able to detect dynamic changes to the image or its source
 * @returns An image ref to set onto the image element and dynamic class names
 * to interpolate into className attributes as needed, which double as status flags
 */
function useSmoothLoadingImageRef(...dependencies: unknown[]) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [, setCurrentSrc, currentSrcRef] = useStateRef('');
  const [doneLoading, setDoneLoading, doneLoadingRef] = useStateRef(false);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    const img = imgRef.current;

    if (!img?.src) {
      setCurrentSrc('');
      setDoneLoading(false);
      setLoadFailed(false);
      return;
    }

    if (img.src !== currentSrcRef.current) {
      setCurrentSrc(img.src);
      setDoneLoading(img.complete);
      setLoadFailed(img.complete && img.naturalWidth === 0 && img.naturalHeight === 0);
    }

    const handleLoad = () => {
      setDoneLoading(true);
      setLoadFailed(false);
    };

    const handleError = () => {
      setDoneLoading(true);
      setLoadFailed(true);
    };

    if (!img.complete) {
      // Image is still loading, so attach event listeners
      img.addEventListener('load', handleLoad);
      img.addEventListener('error', handleError);
    }

    return () => {
      // Remove event listeners when component unmounts or when dependencies change
      img.removeEventListener('load', handleLoad);
      img.removeEventListener('error', handleError);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencies, imgRef, currentSrcRef, doneLoadingRef,
      setCurrentSrc, setDoneLoading, setLoadFailed]);

  // Class names can be interpolated directly into className attributes, and double as status flags
  return {
    imgRef,
    doneLoadingClassName: doneLoading ? ' done-loading' : '',
    loadFailedClassName: loadFailed ? ' load-failed' : '',
  };
};

export default useSmoothLoadingImageRef;
