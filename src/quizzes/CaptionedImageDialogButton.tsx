import { useRef } from "react"
import SmoothLoadingImage from "../SmoothLoadingImage"

interface CaptionedImageDialogButtonProps {
  imageDescription: string
  src: string | undefined
  caption: string
  children: React.ReactNode
}

/**
 * A button that shows a captioned image in a dialog when clicked
 * @param [props.imageDescription] The image description, used as the dialog title
 * and for the button aria-label
 * @param [props.src] The src of the image to load
 * @param [props.caption] The caption for the image
 * @param [props.children] The children content of the button
 */
function CaptionedImageDialogButton({ imageDescription, src,
    caption, children }: CaptionedImageDialogButtonProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return <>
    <dialog ref={dialogRef} className="captioned-image-dialog">
      <button aria-label={`Close ${imageDescription} Dialog`} autoFocus className="dialog-close-button"
          onClick={() => dialogRef.current?.close()}>Close [X]</button>

      <h1>
        {imageDescription}
      </h1>

      <figure>
        <div>
          <SmoothLoadingImage src={src} className="flag" alt="" />
        </div>

        <figcaption>
          {caption}
        </figcaption>
      </figure>
    </dialog>

    <button className="image-dialog-button"
        aria-label={`${imageDescription}, click to show larger`}
        onClick={() => dialogRef.current?.showModal()}>
      {children}
    </button>
  </>;
}

export default CaptionedImageDialogButton;
