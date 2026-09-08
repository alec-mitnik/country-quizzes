// Put src types that are used in node scripts here, so that they don't pull from src files,
// causing the build to check those src files against the node config

import { defineFields } from "@yusifaliyevpro/countries";
import type { Capital, Alpha_3Code as Cca3Code, CountryPicker } from "@yusifaliyevpro/countries/types";

// Include area and population to allow for displaying the overall rankings.
// Include flags to be able to show them and filter by their designs in the directory.
// Include borders to be able to filter on bordering countries for border quizzes.
// Include continents to be able to filter on them in the directory.
// Include classification to be able to filter on independence in the directory.
// Include parent so that parent country names can be filtered out of flag descriptions.
export const shallowFields = defineFields([
  "codes", "names", "classification", "parent", "area", "population", "flag", "borders", "continents",
]);

export const fullFields = defineFields([
  "codes", "names", "capitals", "currencies", "languages",
]);

// The type for a country fetched with shallowFields:
export type ShallowCountry = CountryPicker<typeof shallowFields>;

// The type for a country fetched with fullFields:
export type FullCountry = CountryPicker<typeof fullFields>;

export interface FormattedCountryField<T> {
  label: string,
  rawValue?: T,
  formattedValue?: string,
  markupValue?: React.ReactNode,
  pureTextValue?: string,
}

interface IndependenceDependentFormattedCountryField<T> {
  rawValue?: T,
  formattedValueForAll?: string,
  formattedValueForIndependentOnly?: string,
}

/**
 * Restructured country data for use in quizzes and display
 */
export interface StoredCountry {
  cca3: Cca3Code;
  name: string;
  funFacts?: string[];
  worldFactbookCountryKey?: string;             // For identifying the locator map
  location?: string;
  independent?: boolean;
  independenceDisputed?: boolean;
  parentCountryCca3?: Cca3Code;
  flag?: string;                                // SVG URL
  flagDescription?: string;                     // Descriptive for accessibility,
                                                // but obfuscating the country name for quizzing
  borders?: Cca3Code[];                         // Might reference non-independent countries
  continents?: FormattedCountryField<string[]>;
  capitals?: FormattedCountryField<Capital[]>;
  languages?: FormattedCountryField<string[]>;
  currencies?: FormattedCountryField<string[]>;
  area?: Partial<IndependenceDependentFormattedCountryField<number>>;         // Includes calculated rank
  population?: Partial<IndependenceDependentFormattedCountryField<number>>;   // Includes calculated rank
  populationDensity?: Partial<IndependenceDependentFormattedCountryField<number>>; // Derived from above
}

export interface StoredCountryWrapper {
  data?: StoredCountry,
  requested?: boolean,
  fullyLoaded?: boolean,
}
