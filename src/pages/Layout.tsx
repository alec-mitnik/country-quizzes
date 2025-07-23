import { NavLink, Outlet } from "react-router-dom";
import { COUNTRIES_NAV_TEXT, HOME_NAV_TEXT, QUIZ_NAV_TEXT } from "../consts";

/**
 * Creates the outer structure for each page in the application,
 * with top-level navigation and a main tag
 */
function Layout() {
  return (
    <>
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
    </>
  );
}

export default Layout;
