import { NavLink, Outlet } from "react-router-dom";
import useCountries from "../hooks/useCountries";
import { COUNTRIES_NAV_TEXT, HOME_NAV_TEXT, QUIZ_NAV_TEXT } from "../utils/consts";
import "./Layout.css";

/**
 * Creates the outer structure for each page in the application,
 * with top-level navigation and a main tag
 */
function Layout() {
  const { independentOnly, setIndependentOnly} = useCountries();

  return (
    <div className="layout-component component-wrapper">
      <section id="settings-bar" aria-label="Settings bar">
        <label>
          <input type="checkbox" id="independent-only-checkbox" checked={independentOnly}
              onChange={() => setIndependentOnly(!independentOnly)} />
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

      <main>
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
