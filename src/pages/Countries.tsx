import type { Cca3Code } from "@yusifaliyevpro/countries/types";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { COUNTRIES_SEARCH_ACCESSIBLE_NAME, COUNTRIES_TITLE, NO_COUNTRIES_LOADED_MESSAGE, NO_COUNTRIES_MATCHED_MESSAGE } from "../consts";
import useCountries from "../hooks/useCountries";
import useInitialized from "../hooks/useInitialized";
import RenderWithLoading from "../RenderWithLoading";
import Page from "./Page";

/**
 * Displays all the independent countries supplied by the REST Countries API
 * as links to their own respective pages, along with a search input for filtering
 */
function Countries() {
  const [searchTerm, setSearchTerm] = useState("");
  const { storedCountries, error, loading, fetchCountryNamesAndCodes } = useCountries();
  const loaded = useInitialized(loading, fetchCountryNamesAndCodes);

  const countryCodes: Cca3Code[] = useMemo(() => {
    if (loaded && !error && Object.keys(storedCountries).length) {
      return Object.values(storedCountries).sort((a, b) => {
        // Sort alphabetically by name
        return a.name.localeCompare(b.name);
      }).map((country) => country.cca3);
    } else {
      return [];
    }
  }, [storedCountries, loaded, error]);


  // Filter by name
  const filteredCountryCodes = countryCodes.filter(countryCode => {
    return !searchTerm || storedCountries[countryCode].name.toLowerCase()
        .includes(searchTerm.toLowerCase());
  });

  return (
    <Page pageTitle={COUNTRIES_TITLE}>
      <RenderWithLoading loaded={loaded} error={error}
          dataExists={countryCodes.length > 0} noDataMessage={NO_COUNTRIES_LOADED_MESSAGE}>
        <>
          <input type="search" placeholder="🔍︎ Filter Countries..."
              aria-label={COUNTRIES_SEARCH_ACCESSIBLE_NAME}
              onChange={(e) => setSearchTerm(e.currentTarget.value)} />

          {!filteredCountryCodes.length && <p>{NO_COUNTRIES_MATCHED_MESSAGE}</p>}

          {!!filteredCountryCodes.length && <nav className="directory" aria-labelledby="page-title">
            <ul>
              {filteredCountryCodes.map((countryCode) => {
                const countryName = storedCountries[countryCode].name;

                return (
                  <li key={countryName}>
                    <Link to={`/countries/${countryCode}`}>
                      {countryName}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>}
        </>
      </RenderWithLoading>
    </Page>
  );
}

export default Countries;
