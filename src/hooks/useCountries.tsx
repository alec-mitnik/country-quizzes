import type { Cca3Code, Country } from "@yusifaliyevpro/countries/types";
import { use, useCallback, useEffect, useState } from "react";
import { CountriesContext } from "../CountriesContext";
import type { StoredCountry } from "../CountriesProvider";
import useFetch from "./useFetch";

// Doing just independent countries, since it's odd to think of something like
// "United States Virgin Islands" as a country in this context
const NAMES_AND_CODES_URL = "https://restcountries.com/v3.1/independent?fields=cca3,name";

/**
 * Gives the full fetch URL to use for getting full data for specified countries
 * @param countryCodes cca3 codes of the countries to get data for
 * @returns The constructed URL
 */
function getFullCountryFetchUrl(countryCodes: string[]) {
  return `https://restcountries.com/v3.1/alpha?codes=${
    countryCodes.join(",")
  }&fields=cca3,name,capital,flags,currencies,borders,continents,languages,area,population`;
}

function isCountryFullyLoaded(storedCountry: StoredCountry | undefined) {
  return storedCountry?.currencies && storedCountry.capitals && storedCountry.languages
      && storedCountry.area && storedCountry.population && storedCountry.continents;
}

/**
 * Handles fetching country data and providing the accumulated data and statuses.
 * The @yusifaliyevpro/countries package used for typing the country API data
 * actually provides its own methods for loading the data as well, but I
 * deliberately implemented this all myself for the purpose of this exercise.
 * @returns All the accumulated loaded country data and loading/error statuses,
 * as well as functions for fetching country data
 */
function useCountries() {
  const { state, initiateFetch, setStateForUrl } = useFetch<Partial<Country>[]>();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { storedCountries, updateStoredCountriesFromData, namesAndCodesLoaded } = use(CountriesContext);

  /**
   * Gets data for the country with the specified cca3 code,
   * fetching from the API if not already stored,
   * and updates the context values and state accordingly.
   * Country data doesn't need to be refreshed often,
   * so it's fine to only fetch once per session.
   * @param cca3 Code of the country to get data for
   * @returns true if already loaded
   */
  const fetchCountry = useCallback((cca3: Cca3Code) => {
    if (isCountryFullyLoaded(storedCountries[cca3])) {
      return true;
    }

    const countryUrl = getFullCountryFetchUrl([cca3]);
    void initiateFetch(countryUrl);

    return false;
  }, [storedCountries, initiateFetch]);

  /**
   * Gets data for the countries with the specified cca3 codes,
   * fetching from the API if not already stored,
   * and updates the context values and state accordingly.
   * Country data doesn't need to be refreshed often,
   * so it's fine to only fetch once per session.
   * @param countryCodes cca3 codes of the countries to get data for
   * @returns true if all requested countries are already loaded
   */
  const fetchCountries = useCallback((countryCodes: string[]) => {
    const countryCodesToLoad = [];

    for (const cca3 of countryCodes) {
      if (!isCountryFullyLoaded(storedCountries[cca3])) {
        countryCodesToLoad.push(cca3);
      }
    }

    if (!countryCodesToLoad.length) {
      // All requested countries are already loaded
      return true;
    }

    const countriesUrl = getFullCountryFetchUrl(countryCodesToLoad);
    void initiateFetch(countriesUrl);

    return false;
  }, [storedCountries, initiateFetch]);

  /**
   * Gets the names and cca3 codes for all independent countries,
   * fetching from the API if not already stored,
   * and updates the context values and state accordingly.
   * Country data doesn't need to be refreshed often,
   * so it's fine to only fetch once per session.
   * @returns true if already loaded
   */
  const fetchCountryNamesAndCodes = useCallback(() => {
    if (namesAndCodesLoaded) {
      return true;
    }

    void initiateFetch(NAMES_AND_CODES_URL);
    return false;
  }, [namesAndCodesLoaded, initiateFetch]);

  useEffect(() => {
    const combinedError = [];
    let combinedLoading = false;

    for (const [url, {data, error, loading}] of Object.entries(state)) {
      if (error) {
        combinedError.push(error);
      }

      combinedLoading ||= loading;

      if (!loading && !error && data?.length) {
        updateStoredCountriesFromData(data, url === NAMES_AND_CODES_URL);
        setStateForUrl({data: null}, url);
      }
    }

    const combinedErrorStr = combinedError.length ? combinedError.join(" | ") : null;

    if (combinedErrorStr !== error) {
      setError(combinedErrorStr);
    }

    if (combinedLoading !== loading) {
      setLoading(combinedLoading);
    }
  }, [state, namesAndCodesLoaded, storedCountries, error, loading,
      setError, setLoading, updateStoredCountriesFromData, setStateForUrl]);

  return { storedCountries, error, loading,
      fetchCountryNamesAndCodes, fetchCountry, fetchCountries };
}

export default useCountries;
