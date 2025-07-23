import type { Country } from "@yusifaliyevpro/countries/types";
import { createContext } from "react";
import type { StoredCountry } from "./CountriesProvider";

interface CountriesContextType {
  // TypeScript doesn't support typing the key to Cca3Code
  // without requiring that all possible codes have entries
  storedCountries: Record<string, StoredCountry>;
  updateStoredCountriesFromData: (data: Partial<Country>[], onlyNamesAndCodes?: boolean) => void;
  namesAndCodesLoaded: boolean;
};

/**
 * Context for the accumulated and restructured countries data
 */
export const CountriesContext = createContext<CountriesContextType>({
  storedCountries: {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  updateStoredCountriesFromData: (_data: Partial<Country>[]) => {},
  namesAndCodesLoaded: false,
});
