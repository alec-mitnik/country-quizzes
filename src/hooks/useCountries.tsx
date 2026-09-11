import type { Alpha_3Code as Cca3Code } from "@yusifaliyevpro/countries/types";
import { use, useCallback, useEffect, useState } from "react";
import type { FullCountry, ShallowCountry } from "../../types/commonTypes";
import { CountriesContext } from "../CountriesContext";
import useFetch from "./useFetch";

// Reroutes to the Netlify function which applies the API key,
// sets the response fields, and uses the @yusifaliyevpro/countries package.
const SHALLOW_DATA_URL = '/.netlify/functions/countries?all=1';

/**
 * Gives the full fetch URL to use for getting non-shallow data for specified countries.
 * Reroutes to the Netlify function which applies the API key,
 * sets the response fields, and uses the @yusifaliyevpro/countries package.
 * @param countryCodes cca3 codes of the countries to get data for
 * @returns The constructed URL
 */
function getFullCountryFetchUrl(countryCodes: string[]) {
  return `/.netlify/functions/countries?codes=${countryCodes.join(",")}`;
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
  const { state, initiateFetch, setStateForUrl } = useFetch<(ShallowCountry | FullCountry)[]>();
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
    const combinedError = new Set<string>();
    let combinedLoading = false;

    for (const [url, {data, error, loading}] of Object.entries(state)) {
      if (error) {
        combinedError.add(error);
      }

      combinedLoading ||= loading;

      if (!loading && !error && data?.length) {
        updateStoredCountriesFromData(data, url === SHALLOW_DATA_URL);
        setStateForUrl({data: null}, url);
      }
    }

    const combinedErrorArray = Array.from(combinedError);
    const combinedErrorStr = combinedErrorArray.length ? combinedErrorArray.join(" | ") : null;

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
