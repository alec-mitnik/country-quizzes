import type { Country } from "@yusifaliyevpro/countries/types";
import { createContext } from "react";
import type { CountryStorage } from "./CountriesProvider";
import { DEFAULT_COUNTRY_STORAGE } from "./utils/consts";

interface CountriesContextType {
  // Whether to restrict to independent countries for the directory page and quizzes
  independentOnly: boolean;
  setIndependentOnly: (independentOnly: boolean) => void;
  storedCountryData: CountryStorage;
  markShallowDataAsRequested: () => void;
  markCountriesAsRequested: (countryCodes: string[]) => void;
  updateStoredCountriesFromData: (data: Partial<Country>[], shallowData?: boolean) => void;
  resetNonLoadedRequestStates: () => void;
};

/**
 * Context for the accumulated and restructured countries data
 */
/* eslint-disable @typescript-eslint/no-empty-function */
export const CountriesContext = createContext<CountriesContextType>({
  independentOnly: false,
  setIndependentOnly: () => {},
  storedCountryData: DEFAULT_COUNTRY_STORAGE,
  markShallowDataAsRequested: () => {},
  markCountriesAsRequested: () => {},
  updateStoredCountriesFromData: (_data: Partial<Country>[]) => {},
  resetNonLoadedRequestStates: () => {},
});
