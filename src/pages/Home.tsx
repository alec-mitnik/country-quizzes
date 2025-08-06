import useSmoothLoadingImageRef from "../hooks/useSmoothLoadingImageRef";
import { HOME_SUBHEADER, PORTFOLIO_LINK_ACCESSIBLE_NAME, PORTFOLIO_URL } from "../utils/consts";
import "./Home.css";
import Page from "./Page";

/**
 * A simple landing page for the app with a link to my portfolio site
 */
function Home() {
  const { imgRef, doneLoadingClassName, loadFailedClassName } = useSmoothLoadingImageRef();

  return (
    <Page>
      <div className="home-component">
        <h2>{HOME_SUBHEADER}</h2>

        <div className="home-intro">
          <p>
            Learn about countries and play fun quizzes!
          </p>
          <p>
            Data is provided by the <a href="https://restcountries.com/"
                target="_blank" rel="noopener noreferrer author">
              REST Countries API
            </a>.
          </p>
          {/* TODO - use public domain country locator maps (and edited descriptions)
          from the CIA's World Factbook (https://www.cia.gov/the-world-factbook/) */}
        </div>

        {/* Portfolio Link */}
        <a id="portfolio-link" className={`smooth-loading${doneLoadingClassName}${loadFailedClassName}`}
            href={PORTFOLIO_URL} target="_blank" rel="noopener noreferrer author"
            aria-label={PORTFOLIO_LINK_ACCESSIBLE_NAME}>
          {!!loadFailedClassName && PORTFOLIO_LINK_ACCESSIBLE_NAME}
          <img ref={imgRef} src="./PXL_Avatar_1B.jpg" alt="" />
        </a>
      </div>
    </Page>
  );
}

export default Home;
