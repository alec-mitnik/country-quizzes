import SmoothLoadingImage from "../SmoothLoadingImage";
import CaptionedImageDialogButton from "./CaptionedImageDialogButton";

interface CaptionedImageForMatchingProps {
  imageDescription: string;
  src: string | undefined;
  caption: string;
}

/**
 * For matching quizzes like flag or location, displays a collapsible caption
 * and a miniature image that can be viewed in full in a dialog by clicking the image
 * @param [props.imageDescription] The image description
 * @param [props.src] The src of the image to load
 * @param [props.caption] The caption for the image
 */
function CaptionedImageForMatching({ imageDescription, src,
    caption }: CaptionedImageForMatchingProps) {
  return <>
    <figure>
      <CaptionedImageDialogButton imageDescription={imageDescription} src={src} caption={caption}>
        <SmoothLoadingImage src={src} alt={imageDescription} className="flag" />
      </CaptionedImageDialogButton>

      <figcaption>
        <details name="caption">
          <summary>
            Location Description
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
