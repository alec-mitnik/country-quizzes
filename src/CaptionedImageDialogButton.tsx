import { useRef } from "react"
import "./CaptionedImageDialogButton.css"
import useSmoothLoadingImageRef from "./hooks/useSmoothLoadingImageRef"

interface CaptionedImageDialogButtonProps {
  imageDescription: string
  src: string | undefined
  caption: string
  children: React.ReactNode
}

/**
 * A button that shows a captioned image in a dialog when clicked
 * @param {string} [props.imageDescription] The image description, used as the dialog title
 * and for the button aria-label
 * @param {string} [props.src] The src of the image to load
 * @param {string} [props.caption] The caption for the image
 * @param {React.ReactNode} [props.children] The children content of the button
 */
function CaptionedImageDialogButton({ imageDescription, src,
    caption, children }: CaptionedImageDialogButtonProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { imgCallbackRef, doneLoadingClassName, loadFailedClassName } = useSmoothLoadingImageRef();

  return <div className="captioned-image-dialog-wrapper">
    <dialog ref={dialogRef} className="captioned-image-dialog">
      <button type="button" aria-label={`Close ${imageDescription} Dialog`} autoFocus className="dialog-close-button"
          onClick={() => dialogRef.current?.close()}>Close [X]</button>

      <h1>
        {imageDescription}
      </h1>

      <figure>
        <div className={`smooth-loading with-max-height${doneLoadingClassName}${loadFailedClassName}`}>
          <img ref={imgCallbackRef} src={src} className="flag" alt="" loading="lazy" />
        </div>

        <figcaption>
          {caption}
        </figcaption>
      </figure>
    </dialog>

    <button type="button" className="image-dialog-button"
        aria-label={`${imageDescription}, click to show larger`}
        onClick={() => dialogRef.current?.showModal()}>
      {children}
    </button>
  </div>;
}

export default CaptionedImageDialogButton;
