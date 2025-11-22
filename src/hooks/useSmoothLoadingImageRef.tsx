import { useCallback, useEffect, useRef, useState } from "react";
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
  const [imgHasAttached, setImgHasAttached] = useState(false);
  const [, setCurrentSrc, currentSrcRef] = useStateRef('');
  const [doneLoading, setDoneLoading, doneLoadingRef] = useStateRef(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const imagesDisabled = useRef(false);

  // A callback ref can be used like a useRef value, but will automatically
  // be called when the element attaches
  const imgCallbackRef = useCallback((imgElement: HTMLImageElement) => {
    imgRef.current = imgElement;
    const hasAttached = !!imgElement;

    if (hasAttached !== imgHasAttached) {
      setImgHasAttached(hasAttached);
    }
  }, [setImgHasAttached, imgHasAttached]);

  // The events won't be triggered if images are disabled by the browser,
  // so attempt to detect that with a test image
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      // If the timeout was reached, images are probably disabled
      imagesDisabled.current = true;

      // Mark loading as failed immediately
      setDoneLoading(true);
      setLoadFailed(true);
    }, 50);

    function onImageLoad() {
      clearTimeout(timeoutId);
      img.removeEventListener('load', onImageLoad);
      img.removeEventListener('error', onImageLoad);
      img.remove();
      imagesDisabled.current = false;
    }

    const img = new Image();
    img.addEventListener('load', onImageLoad, { once: true });
    img.addEventListener('error', onImageLoad, { once: true });

    // 1x1 transparent gif
    img.src = "data:image/gif;base64,R0lGODlhAQABAAAAACw=";

    return () => {
      clearTimeout(timeoutId);
      img.removeEventListener('load', onImageLoad);
      img.removeEventListener('error', onImageLoad);
      img.remove();
    }
  }, [setDoneLoading, setLoadFailed]);

  useEffect(() => {
    const img = imgRef.current;

    if (!imgHasAttached || !img?.src) {
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

      // If images are disabled, immediately fail
      if (imagesDisabled.current) {
        setDoneLoading(true);
        setLoadFailed(true);
      }
    }

    return () => {
      // Remove event listeners when component unmounts or when dependencies change
      img.removeEventListener('load', handleLoad);
      img.removeEventListener('error', handleError);
    };
  // Spread operator prevents the linter from being able to analyze exhaustive dependencies
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencies, imgHasAttached, imgRef, currentSrcRef, doneLoadingRef,
      setCurrentSrc, setDoneLoading, setLoadFailed]);

  // Force Safari to recalculate the filter region after the image is ready and visible
  useEffect(() => {
    const img = imgRef.current;
    if (!img || !doneLoading || loadFailed) {
      return;
    }

    // Triggers when an observed element exits or enters the viewport,
    // including if it is already in the viewport initially
    const observer = new IntersectionObserver((entries) => {

      if (entries[0].isIntersecting) {
        const originalTransform = img.style.transform;
        img.style.transform = 'translateZ(0.001px)';

        requestAnimationFrame(() => {
          if (img) {
            img.style.transform = originalTransform;
          }
        });

        observer.disconnect();
      }
    });

    observer.observe(img);
  }, [doneLoading, loadFailed, imgRef]);

  // Class names can be interpolated directly into className attributes, and double as status flags
  return {
    imgCallbackRef,
    imgHasAttached,
    doneLoadingClassName: doneLoading ? ' done-loading' : '',
    loadFailedClassName: loadFailed ? ' load-failed' : '',
  };
};

export default useSmoothLoadingImageRef;
