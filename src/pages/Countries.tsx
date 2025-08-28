import type { Cca3Code } from "@yusifaliyevpro/countries/types";
import { localeIncludes } from "locale-includes";
import { useEffect, useMemo, useState } from "react";
import CountryDirectoryLink from "../CountryDirectoryLink";
import useCountries from "../hooks/useCountries";
import RenderWithLoading from "../RenderWithLoading";
import {
  COUNTRIES_SEARCH_ACCESSIBLE_NAME, COUNTRIES_TITLE, NO_COUNTRIES_LOADED_MESSAGE,
  NO_COUNTRIES_MATCHED_MESSAGE
} from "../utils/consts";
import "./Countries.css";
import Page from "./Page";

/**
 * Displays all the independent countries supplied by the REST Countries API
 * as links to their own respective pages, along with a search input for filtering
 */
function Countries() {
  const [searchTerm, setSearchTerm] = useState("");
  const { independentOnly, storedCountryData, error,
      fetchShallowDataForAllCountries } = useCountries();

  useEffect(() => {
    if (!error && !storedCountryData.shallowDataRequested) {
      fetchShallowDataForAllCountries();
    }
  }, [error, storedCountryData.shallowDataRequested, fetchShallowDataForAllCountries]);

  // TODO - support sorting by size, population, etc.
  const countryCodes: Cca3Code[] = useMemo(() => {
    if (!error && storedCountryData.shallowDataLoaded
        && Object.keys(storedCountryData.countries).length) {
      return Object.values(storedCountryData.countries).sort((a, b) => {
        // Sort alphabetically by name
        return a?.data?.name.localeCompare(b?.data?.name ?? "") ?? 0;
      }).map((country) => country?.data?.cca3).filter(Boolean) as Cca3Code[];
    } else {
      return [];
    }
  }, [storedCountryData, error]);

  // Filter by independence
  const countryCodesFilteredByIndependence = useMemo(() => {
    if (independentOnly) {
      return countryCodes.filter(countryCode =>
          storedCountryData.countries[countryCode]?.data?.independent);
    } else {
      return countryCodes;
    }
  }, [countryCodes, independentOnly, storedCountryData]);

  // Filter by search
  const countryCodesFilteredBySearch = useMemo(() => {
    return countryCodesFilteredByIndependence.filter(countryCode => {
      return !searchTerm
          || localeIncludes(storedCountryData.countries[countryCode]?.data?.name ?? "",
          searchTerm, {
            usage: "search",    // Optimize for filtering
            sensitivity: "base" // Ignore case and diacritics
          });
    });
  }, [countryCodesFilteredByIndependence, searchTerm, storedCountryData]);

  return (
    <Page pageTitle={COUNTRIES_TITLE}>
      <RenderWithLoading loaded={storedCountryData.shallowDataLoaded} error={error}
          dataExists={countryCodesFilteredByIndependence.length > 0}
          noDataMessage={NO_COUNTRIES_LOADED_MESSAGE}>
        <div className="countries-component component-wrapper">
          <label>
            {COUNTRIES_SEARCH_ACCESSIBLE_NAME}
            <input type="search" id="countries-filter" placeholder="🔍︎ Start typing to filter..."
                onChange={(e) => setSearchTerm(e.currentTarget.value)} />
          </label>

          {!countryCodesFilteredBySearch.length && <p>{NO_COUNTRIES_MATCHED_MESSAGE}</p>}

          {!!countryCodesFilteredBySearch.length && <nav className="directory" aria-labelledby="page-title">
            <ul>
              {countryCodesFilteredBySearch.map((countryCode) => {
                const countryName = storedCountryData.countries[countryCode]?.data?.name ?? "ERROR";
                const flag = storedCountryData.countries[countryCode]?.data?.flag;

                return (
                  <CountryDirectoryLink key={countryName} cca3={countryCode}
                      countryName={countryName} flag={flag} />
                );
              })}
            </ul>
          </nav>}
        </div>
      </RenderWithLoading>
    </Page>
  );
}

export default Countries;
