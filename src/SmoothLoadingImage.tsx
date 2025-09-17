import useSmoothLoadingImageRef from "./hooks/useSmoothLoadingImageRef";

/**
 * An image component that handles its own smooth loading.
 * Useful for when handling multiple images,
 * but doesn't support having other elements depend on its loading state.
 */
function SmoothLoadingImage({src, className = "",
    ...htmlImageProps}: React.ImgHTMLAttributes<HTMLImageElement>) {
  const { imgCallbackRef, doneLoadingClassName, loadFailedClassName } = useSmoothLoadingImageRef();

  return src ? <img ref={imgCallbackRef} src={src}
      className={`${className} smooth-loading${doneLoadingClassName}${loadFailedClassName}`}
      {...htmlImageProps} /> : null;
}

export default SmoothLoadingImage;
