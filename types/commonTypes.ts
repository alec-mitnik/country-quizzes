// Put src types that are used in node scripts here, so that they don't pull from src files,
// causing the build to check those src files against the node config

import type { Capital, Cca3Code } from "@yusifaliyevpro/countries/types";

export interface FormattedCountryField<T> {
  label: string,
  rawValue?: T,
  formattedValue?: string,
  markupValue?: React.ReactNode,
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
