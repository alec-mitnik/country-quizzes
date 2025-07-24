import { useState } from "react";
import { HOME_SUBHEADER, PORTFOLIO_LINK_ACCESSIBLE_NAME, PORTFOLIO_URL } from "../consts";
import Page from "./Page";

/**
 * A simple landing page for the app with a link to my portfolio site
 */
function Home() {
  const [portfolioImageLoaded, setPortfolioImageLoaded] = useState(false);

  function onPortfolioImageLoaded() {
    setPortfolioImageLoaded(true);
  }

  return (
    <Page>
      <h2>{HOME_SUBHEADER}</h2>

      {/* Portfolio Link */}
      <a id="portfolio-link" className={`smooth-loading ${portfolioImageLoaded ? 'loaded' : ''}`}
          href={PORTFOLIO_URL} target="_blank" rel="noopener noreferrer author"
          aria-label={PORTFOLIO_LINK_ACCESSIBLE_NAME}>
        <img src="./PXL_Avatar_1B.jpg" alt="" onLoad={onPortfolioImageLoaded}
            onError={onPortfolioImageLoaded} />
      </a>
    </Page>
  );
}

export default Home;
