import CaptionedImageDialogButton from "../CaptionedImageDialogButton";
import SmoothLoadingImage from "../SmoothLoadingImage";

interface CaptionedImageForMatchingProps {
  imageTerm: string;
  src: string | undefined;
  caption: string;
}

/**
 * For matching quizzes like flag or location, displays a collapsible caption
 * and a miniature image that can be viewed in full in a dialog by clicking the image
 * @param {string} [props.imageTerm] The country property represented by the image
 * @param {string} [props.src] The src of the image to load
 * @param {string} [props.caption] The caption for the image
 */
function CaptionedImageForMatching({ imageTerm, src,
    caption }: CaptionedImageForMatchingProps) {
  return <>
    <figure>
      <CaptionedImageDialogButton imageDescription={`Country ${imageTerm}`} src={src} caption={caption}>
        <SmoothLoadingImage src={src} alt={`Country ${imageTerm}`} className="flag" draggable={false} />
      </CaptionedImageDialogButton>

      <figcaption>
        <details name="caption">
          <summary>
            {imageTerm} Description
          </summary>
          <p>
            {caption}
          </p>
        </details>
      </figcaption>
    </figure>
  </>;
}

export default CaptionedImageForMatching;
