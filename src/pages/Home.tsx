import useSmoothLoadingImageRef from "../hooks/useSmoothLoadingImageRef";
import { CIA_WORLD_FACTBOOK_LINK_TEXT, CIA_WORLD_FACTBOOK_LINK_URL, HOME_SUBHEADER, PORTFOLIO_LINK_ACCESSIBLE_NAME, PORTFOLIO_URL, REST_COUNTRIES_API_LINK_TEXT, REST_COUNTRIES_API_LINK_URL } from "../utils/consts";
import "./Home.css";
import Page from "./Page";

/**
 * A simple landing page for the app with a link to my portfolio site
 */
function Home() {
  const { imgCallbackRef, doneLoadingClassName, loadFailedClassName, instantLoadClassName }
      = useSmoothLoadingImageRef();

  return (
    <Page>
      <div className="home-component component-wrapper">
        <h2>{HOME_SUBHEADER}</h2>

        <div className="home-intro">
          <p>
            Learn about countries and play fun quizzes!
          </p>
          <p>
            Stay tuned for new features as I continue to develop this.
          </p>
          <p>
            Data is derived from the <a href={REST_COUNTRIES_API_LINK_URL}
                target="_blank" rel="noopener noreferrer author">
              {REST_COUNTRIES_API_LINK_TEXT}
            </a>, the <a href={CIA_WORLD_FACTBOOK_LINK_URL}
                target="_blank" rel="noopener noreferrer author">
              {CIA_WORLD_FACTBOOK_LINK_TEXT}
            </a>, and Wikipedia.
          </p>
        </div>

        {/* Portfolio Link */}
        <a id="portfolio-link" href={PORTFOLIO_URL} target="_blank" rel="noopener noreferrer author"
            className={`smooth-loading${doneLoadingClassName}${loadFailedClassName}${instantLoadClassName}`}
            aria-label={PORTFOLIO_LINK_ACCESSIBLE_NAME}>
          {!!loadFailedClassName && PORTFOLIO_LINK_ACCESSIBLE_NAME}
          <img ref={imgCallbackRef} src="/images/PXL_Avatar_1B.jpg" alt="" />
        </a>
      </div>
    </Page>
  );
}

export default Home;
