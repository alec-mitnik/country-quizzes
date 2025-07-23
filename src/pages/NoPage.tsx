import { NO_PAGE_TITLE } from "../consts";
import Page from "./Page";

/**
 * The 404 page for unrecognized URLs
 */
function NoPage() {
  return (
    <Page pageTitle={NO_PAGE_TITLE} />
  );
}

export default NoPage;
