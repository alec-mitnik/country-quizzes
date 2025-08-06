import type { Cca3Code, Country } from "@yusifaliyevpro/countries/types";
import { use, useCallback, useEffect, useState } from "react";
import { CountriesContext } from "../CountriesContext";
import useFetch from "./useFetch";

// Include area and population to allow for displaying the overall rankings.
const SHALLOW_DATA_URL = "https://restcountries.com/v3.1/all?fields=cca3,name,independent,area,population";

/**
 * Gives the full fetch URL to use for getting full data for specified countries
 * @param countryCodes cca3 codes of the countries to get data for
 * @returns The constructed URL
 */
function getFullCountryFetchUrl(countryCodes: string[]) {
  return `https://restcountries.com/v3.1/alpha?codes=${
    countryCodes.join(",")
  }&fields=cca3,name,independent,capital,flags,currencies,borders,continents,languages,area,population`;
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

  const { independentOnly, setIndependentOnly, storedCountryData,
      markShallowDataAsRequested, markCountriesAsRequested,
      updateStoredCountriesFromData, resetNonLoadedRequestStates } = use(CountriesContext);

  // On unmount, reset all non-loaded request flags
  useEffect(() => {
    return () => resetNonLoadedRequestStates();
  }, [resetNonLoadedRequestStates]);

  /**
   * Gets data for the country with the specified cca3 code,
   * fetching from the API if not already stored,
   * and updates the context values and state accordingly.
   * Country data doesn't need to be refreshed often,
   * so it's fine to only fetch once per session.
   * @param cca3 Code of the country to get data for
   */
  const fetchCountry = useCallback((cca3: Cca3Code) => {
    const countryUrl = getFullCountryFetchUrl([cca3]);

    if (storedCountryData.countries[cca3]?.requested) {
      return;
    }

    markCountriesAsRequested([cca3]);
    void initiateFetch(countryUrl);
  }, [storedCountryData, markCountriesAsRequested, initiateFetch]);

  /**
   * Gets data for the countries with the specified cca3 codes,
   * fetching from the API if not already stored,
   * and updates the context values and state accordingly.
   * Country data doesn't need to be refreshed often,
   * so it's fine to only fetch once per session.
   * @param countryCodes cca3 codes of the countries to get data for
   */
  const fetchCountries = useCallback((countryCodes: Cca3Code[]) => {
    const countryCodesToLoad: Cca3Code[] = [];

    for (const cca3 of countryCodes) {
      if (!storedCountryData.countries[cca3]?.requested) {
        countryCodesToLoad.push(cca3);

        storedCountryData.countries[cca3] = {
          ...storedCountryData.countries[cca3],
          requested: true,
        };
      }
    }

    if (!countryCodesToLoad.length) {
      // All requested countries are already loaded
      return;
    }

    const countriesUrl = getFullCountryFetchUrl(countryCodesToLoad);

    markCountriesAsRequested(countryCodesToLoad);
    void initiateFetch(countriesUrl);
  }, [storedCountryData, markCountriesAsRequested, initiateFetch]);

  /**
   * Gets the shallow data for all independent countries,
   * fetching from the API if not already stored,
   * and updates the context values and state accordingly.
   * Country data doesn't need to be refreshed often,
   * so it's fine to only fetch once per session.
   */
  const fetchShallowDataForAllCountries = useCallback(() => {
    if (storedCountryData.shallowDataRequested) {
      return;
    }

    markShallowDataAsRequested();
    void initiateFetch(SHALLOW_DATA_URL);
  }, [storedCountryData, markShallowDataAsRequested, initiateFetch]);

  // Set the combined error and loading states,
  // and store any new country data
  useEffect(() => {
    const combinedError = [];
    let combinedLoading = false;

    for (const [url, {data, error, loading}] of Object.entries(state)) {
      if (error) {
        combinedError.push(error);
      }

      combinedLoading ||= loading;

      if (!loading && !error && data?.length) {
        updateStoredCountriesFromData(data, url === SHALLOW_DATA_URL);
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
  }, [state, storedCountryData, error, loading,
      setError, setLoading, updateStoredCountriesFromData, setStateForUrl]);

  return { independentOnly, setIndependentOnly, storedCountryData, error, loading,
      fetchShallowDataForAllCountries, fetchCountry, fetchCountries };
}

export default useCountries;
