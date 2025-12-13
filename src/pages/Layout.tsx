import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import Button from "../Button";
import useCountries from "../hooks/useCountries";
import {
  isLocalStorageAvailable, useLocalStorageStateBoolean, useLocalStorageStateString
} from "../hooks/useLocalStorageState";
import {
  COLLAPSE_SETTINGS_BAR_BUTTON_ACCESSIBLE_NAME,
  COLOR_SCHEME_SELECT_ACCESSIBLE_NAME, COUNTRIES_NAV_TEXT,
  DISMISS_LOCAL_STORAGE_WARNING_BUTTON_ACCESSIBLE_NAME,
  EXPAND_SETTINGS_BAR_BUTTON_ACCESSIBLE_NAME,
  HOME_NAV_TEXT, QUIZ_NAV_TEXT, SETTINGS_BAR_ACCESSIBLE_NAME
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
  const [colorScheme, setColorScheme] = useLocalStorageStateString("colorScheme", "");
  const [settingsBarCollapsed, setSettingsBarCollapsed] =
      useLocalStorageStateBoolean("settingsBarCollapsed");

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
      {/* A class name of "banner" can trigger ad blockers! */}
      <div className="header-bar">
        <div className="header-bar-content">
          {!localStorageAvailable && !localStorageWarningDismissed && <div className="local-storage-warning">
            <p>Warning: local storage unavailable.  Data will not be saved!</p>

            <Button type="button" aria-label={DISMISS_LOCAL_STORAGE_WARNING_BUTTON_ACCESSIBLE_NAME}
                className="small outlined" onClick={() => setLocalStorageWarningDismissed(true)}>
              X
            </Button>
          </div>}

          <section id="settings-bar" className={`${settingsBarCollapsed ? "collapsed" : ""}`}
              aria-label={SETTINGS_BAR_ACCESSIBLE_NAME}>
            <div className="settings-controls">
              <div>
                <label>
                  <span>{COLOR_SCHEME_SELECT_ACCESSIBLE_NAME}</span>
                  <select id="color-scheme-select" value={colorScheme}
                      onChange={event => setColorScheme(event.target.value)}>
                    <option value="">Auto</option>
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                  </select>
                </label>
              </div>

              <div className="spacer"></div>

              <div>
                <label>
                  <input type="checkbox" id="independent-only-checkbox" checked={independentOnly}
                      onChange={event => setIndependentOnly(event.target.checked)} />
                  <span>Independent Countries Only</span>
                </label>
              </div>
            </div>
          </section>

          <div className="bar-bottom">
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

            <Button id="settings-bar-toggle-button" className={`small outlined ${settingsBarCollapsed ? "expand" : "collapse"}`}
                onClick={() => setSettingsBarCollapsed(!settingsBarCollapsed)}
                aria-label={settingsBarCollapsed ? EXPAND_SETTINGS_BAR_BUTTON_ACCESSIBLE_NAME
                : COLLAPSE_SETTINGS_BAR_BUTTON_ACCESSIBLE_NAME}>
              <span className={`button-content ${settingsBarCollapsed ? "" : "symbol-font"}`}></span>
            </Button>
          </div>
        </div>
      </div>

      <main ref={mainElementRef}>
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
