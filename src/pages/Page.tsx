import { useEffect } from "react";
import { APP_TITLE } from "../utils/consts";

interface PageProps {
  pageTitle?: string;
  children?: React.ReactNode;
}

/**
 * Wrapper for the content of each page in the application,
 * handling the main header and updating the document title
 * @param {string} [props.pageTitle] The title of the page to display in the header
 * @param {React.ReactNode} [props.children] The content of the page
 */
function Page({pageTitle, children}: PageProps) {
  const headerTitle = pageTitle ?? APP_TITLE;

  useEffect(() => {
    const prefix = pageTitle ? `${pageTitle} - ` : "";
    document.title = `${prefix}${APP_TITLE}`;

    // Focus the heading on load for a more accessible experience,
    // including feedback of navigation for screen reader users.
    // This sometimes causes a focus outline to show unnecessarily, unfortunately.
    document.querySelector("h1")?.focus();
  }, [pageTitle]);

  return (
    <>
      <h1 id="page-title" tabIndex={-1}>{headerTitle}</h1>
      {children}
    </>
  );
}

export default Page;
