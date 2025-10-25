import { useRef } from "react"
import { createPortal } from "react-dom"
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
    {/* Put in the body so that screen readers don't treat the dialog
    as part of a parent figure or data list */}
    {createPortal(<dialog ref={dialogRef} className="captioned-image-dialog"
        aria-label={imageDescription} aria-description={caption}>
      <div className="dialog-inner-wrapper">
        <div className="dialog-backdrop" aria-hidden="true"
            onClick={() => dialogRef.current?.close()}></div>

        <div className="dialog-foreground" tabIndex={-1}>
          {/* Note that autoFocus on this doesn't work, though it does when
          not faking the dialog container, I guess having to do with how React works. */}
          <Button ref={closeButtonRef} type="button" aria-label={`Close Dialog`}
              className="dialog-close-button small" onClick={() => dialogRef.current?.close()}>
            X
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
    </dialog>, document.body)}

    <Button type="button" className="image-dialog-button small"
        aria-label={buttonLabelOverride ?? `${imageDescription}, click to show larger`}
        onClick={() => {
          dialogRef.current?.showModal();

          // onToggle for the dialog doesn't seem to get triggered for iOS,
          // and VoiceOver won't recognize focus on the close button without a delay
          setTimeout(() => closeButtonRef.current?.focus());
        }}>
      {children}
    </Button>
  </div>;
}

export default CaptionedImageDialogButton;
