import useSmoothLoadingImageRef from "./hooks/useSmoothLoadingImageRef";

interface SmoothLoadingImageProps {
  src: string | undefined;
  alt: string | undefined;
  className?: string;
}

/**
 * An image component that handles its own smooth loading.
 * Useful for when handling multiple images,
 * but doesn't support having other elements depend on its loading state.
 * @param {string} [props.src] The src of the image to load
 * @param {string} [props.alt] The alt text for the image
 * @param {string} [props.className=""] The class name for the image
 */
function SmoothLoadingImage({src, alt, className = ""}: SmoothLoadingImageProps) {
  const { imgCallbackRef, doneLoadingClassName, loadFailedClassName } = useSmoothLoadingImageRef();

  return src ? <img ref={imgCallbackRef}
      className={`${className} smooth-loading${doneLoadingClassName}${loadFailedClassName}`}
      src={src}
      alt={alt ?? ""} /> : null;
}

export default SmoothLoadingImage;
