import { HOME_SUBHEADER, PORTFOLIO_LINK_ACCESSIBLE_NAME, PORTFOLIO_URL } from "../consts";
import Page from "./Page";

/**
 * A simple landing page for the app with a link to my portfolio site
 */
function Home() {
  return (
    <Page>
      <h2>{HOME_SUBHEADER}</h2>

      {/* Portfolio Link */}
      <a id="portfolio-link" href={PORTFOLIO_URL} target="_blank"
          rel="noopener noreferrer author" aria-label={PORTFOLIO_LINK_ACCESSIBLE_NAME}>
        <img src="./PXL_Avatar_1B.jpg" alt="" />
      </a>
    </Page>
  );
}

export default Home;
