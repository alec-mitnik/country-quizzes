import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import Button from "../Button";
import useCountries from "../hooks/useCountries";
import { isLocalStorageAvailable } from "../hooks/useLocalStorageState";
import {
  COUNTRIES_NAV_TEXT, HOME_NAV_TEXT, QUIZ_NAV_TEXT,
  SETTINGS_BAR_ACCESSIBLE_NAME
} from "../utils/consts";
import "./Layout.css";

/**
 * Creates the outer structure for each page in the application,
 * with top-level navigation and a main tag
 */
function Layout() {
  const { pathname } = useLocation();
  const mainElementRef = useRef<HTMLElement>(null);
  const { independentOnly, setIndependentOnly} = useCountries();

  // Use a function initializer to only evaluate once on mount rather than every render
  const [localStorageAvailable, setLocalStorageAvailable] = useState(() => isLocalStorageAvailable());
  const [localStorageWarningDismissed, setLocalStorageWarningDismissed] = useState(false);

  // On page navigation
  useEffect(() => {
    const mainElement = mainElementRef.current;

    if (mainElement) {
      // Scroll to the start of the page
      mainElement.scrollTo(0, 0);

      // Ensure a full repaint on iOS
      mainElement.style.opacity = "0";

      requestAnimationFrame(() => {
        mainElement.style.opacity = "";
      });
    }

    // Update the local storage status on navigation
    setLocalStorageAvailable(isLocalStorageAvailable());
  }, [pathname]);

  return (
    <div className="layout-component component-wrapper">
      <section id="settings-bar" aria-label={SETTINGS_BAR_ACCESSIBLE_NAME}>
        {!localStorageAvailable && !localStorageWarningDismissed && <div className="local-storage-warning">
          <div>
            <p>Warning: local storage unavailable.  Data will not be saved!</p>
            <Button type="button" aria-label="Dismiss Warning" className="small"
                onClick={() => setLocalStorageWarningDismissed(true)}>
              X
            </Button>
          </div>
        </div>}

        <label>
          <input type="checkbox" id="independent-only-checkbox" checked={independentOnly}
              onChange={event => setIndependentOnly(event.target.checked)} />
          <span>Independent Countries Only</span>
        </label>
      </section>

      <nav>
        <ul>
          <li>
            <NavLink to="/">{HOME_NAV_TEXT}</NavLink>
          </li>
          <li>
            <NavLink to="/countries" end>{COUNTRIES_NAV_TEXT}</NavLink>
          </li>
          <li>
            <NavLink to="/quiz">{QUIZ_NAV_TEXT}</NavLink>
          </li>
        </ul>
      </nav>

      <main ref={mainElementRef}>
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
