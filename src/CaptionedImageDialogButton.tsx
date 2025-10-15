import { useRef } from "react"
import Button from "./Button"
import "./CaptionedImageDialogButton.css"
import useSmoothLoadingImageRef from "./hooks/useSmoothLoadingImageRef"
import { LOADING_IMAGE_MESSAGE } from "./utils/consts"

interface CaptionedImageDialogButtonProps {
  imageDescription: string
  buttonLabelOverride?: string
  src: string | undefined
  caption: string
  children: React.ReactNode
}

/**
 * A button that shows a captioned image in a dialog when clicked
 * @param {string} [props.imageDescription] The image description, used as the dialog title
 * and for the button aria-label
 * @param {string} [props.buttonLabelOverride] An override for the button aria-label
 * @param {string} [props.src] The src of the image to load
 * @param {string} [props.caption] The caption for the image
 * @param {React.ReactNode} [props.children] The children content of the button
 */
function CaptionedImageDialogButton({ imageDescription, buttonLabelOverride, src,
    caption, children }: CaptionedImageDialogButtonProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const { imgCallbackRef, doneLoadingClassName, loadFailedClassName } = useSmoothLoadingImageRef();

  return <div className="captioned-image-dialog-wrapper">
    <dialog ref={dialogRef} className="captioned-image-dialog"
        onToggle={() => { if (dialogRef.current?.open) { setTimeout(() => closeButtonRef.current?.focus(), 10) } }}>
      <div className="dialog-inner-wrapper">
        <div className="dialog-backdrop" aria-hidden="true"
            onClick={() => dialogRef.current?.close()}></div>

        <div className="dialog-foreground" tabIndex={-1}>
          {/* Note that autoFocus on this doesn't work, though it does when
          not faking the dialog container, I guess because of how React works. */}
          <Button ref={closeButtonRef} type="button" aria-label={`Close ${imageDescription} Dialog`}
              className="dialog-close-button small" onClick={() => dialogRef.current?.close()}>
            Close [X]
          </Button>

          <h1>
            {imageDescription}
          </h1>

          {!doneLoadingClassName && <span className="loading-image">{LOADING_IMAGE_MESSAGE}</span>}
          <figure>
            <div className={`smooth-loading with-max-height${doneLoadingClassName}${loadFailedClassName}`}>
              <div className="scroll-container with-height">
                <img ref={imgCallbackRef} src={src} alt="" loading="lazy"
                    className={`flag${src?.toLowerCase().endsWith('.svg') ? ' svg' : ''}`} />
              </div>
            </div>

            <figcaption>
              {caption}
            </figcaption>
          </figure>
        </div>
      </div>
    </dialog>

    <Button type="button" className="image-dialog-button small"
        aria-label={buttonLabelOverride ?? `${imageDescription}, click to show larger`}
        onClick={() => dialogRef.current?.showModal()}>
      {children}
    </Button>
  </div>;
}

export default CaptionedImageDialogButton;
