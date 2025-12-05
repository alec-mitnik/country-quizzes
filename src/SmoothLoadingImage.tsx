import useSmoothLoadingImageRef from "./hooks/useSmoothLoadingImageRef";

/**
 * An image component that handles its own smooth loading.
 * Useful for when handling multiple images,
 * but doesn't support having other elements depend on its loading state.
 */
function SmoothLoadingImage({src, className = "",
    ...htmlImageProps}: React.ImgHTMLAttributes<HTMLImageElement>) {
  const { imgCallbackRef, doneLoadingClassName, loadFailedClassName, instantLoadClassName }
      = useSmoothLoadingImageRef();

  return src ? <img ref={imgCallbackRef} src={src}
      className={`${className} smooth-loading${doneLoadingClassName}${loadFailedClassName}${
          instantLoadClassName}`}
      {...htmlImageProps} /> : null;
}

export default SmoothLoadingImage;
