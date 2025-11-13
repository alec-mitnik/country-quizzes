import type { Cca3Code } from "@yusifaliyevpro/countries/types";
import type { StoredCountry } from "../../types/commonTypes";
import type { CountryStorage } from "../CountriesProvider";
import { formatCountryDataArray, getCountryNameFromCode } from "../utils/countryUtils";

// Increment this any time a breaking change is introduce to quiz data
// so that preexisting data will be completely discarded rather than cause an error
export const QUIZ_BREAKING_VERSION = 1;

// Increment this any time a breaking change is introduce to quiz round data
// so that only preexisting data for the current round will be discarded
export const QUIZ_ROUND_BREAKING_VERSION = 1;

/*
 * TODO:
 *
 * Edit location descriptions to try to avoid referencing countries in the same group
 *
 * Refactor ranking and matching quiz types to use new utilities for value/label/markup
 *
 * Mark up foreign language phrases in flag descriptions appropriately?  Or just edit them out?
 *
 * Change how drop works to be more intuitive so that top half of item goes above,
 * bottom half goes below, above top item is first, below last item is last,
 * and to the sides of items is not valid
 *
 * Data testing
 *
 * More unit/integration testing
 *
 *
 * Ideas:
 *
 * Sound effects?
 *
 * Show more messages, like encouragement for getting everything right in one go,
 * or a fun fact about one of the countries locked in?
 *
 * Provide a more hands-on tutorial that introduces the mechanics one by one.
 *
 * Adapt code to be data agnostic and work for non-country quiz topics?
 *
 * More fun facts...
 *
 * Maybe more roguelike elements could be introduced, like items and bonuses that
 * reveal more values of the countries involved (languages, currencies, continent, etc.),
 * or submit a country correctly for you.
 * Bonuses could be earned for feats like beating a round in one attempt or
 * getting countries with consecutive ranks correct in one try.
 *
 * Instead of random quiz types, could offer a choice of several random options.
 *
 * Might be fun to have special challenge rounds for all consecutive ranks, flag design groups,
 * or touring locations throughout regions. Challenge rounds could take place at the end of each level,
 * after which you earn a bonus, though this would conflict with obscurity filtering,
 * and independence filtering would affect it too...
 *
 * Challenge rounds could just be one-off quizzes, maybe with a daily rotation
 * to encourage daily play.  Would need to be playable without interrupting a main run, though.
 *
 * Possible bonuses:
 * +1 option to choose from when selecting bonuses
 * +1 option to choose from when selecting quiz types
 * The next time you select a bonus, select a bonus +2 additional times
 * +1 submission for every 3 correct submissions in a row
 * +1 submission when locking in 3 or more countries at a time
 * +3 submissions when locking in 5 or more countries at a time
 * For the first submission of every round, +2 submissions if correct, -1 submission if incorrect
 * When all but one country is locked in, the last country reveals its value (does not stack)
 * When you get 3 incorrect submissions in a row, +1 country reveals its value
 * Decrease the obscurity of countries used by +1 level
 *
 * Could make some match type quizzes extra challenging by including
 * additional countries that don't match to anything.
 *
 * Offer a way to practice specific quiz types, doing a single level at a time
 * (But how to set the difficulty level?).
 *
 * Could track correct/incorrect submissions per country in local storage,
 * and show stats on how well you know each country.
 * Could also track stats on best quiz score, times beaten, and win streaks.
 * Maybe the first win could unlock the stats feature.
 */

export interface CountryGroup {
    nameOverride?: string;
    countryCodes: Cca3Code[];
}

/*
 * More types can be added in the future, like ranking by number of bordering countries,
 * or grouping countries into categories, such as independent or not, has a star on its flag
 * (not feasible unless all stars are sure to be described in the flag descriptions,
 * including within coats of arms, and would need to clarify if the sun counts),
 * is landlocked, is an island (no bordering countries), higher or lower than
 * the median population density, hemisphere, etc.
 *
 * Another type could be showing countries in a fixed order, and having to mark them as
 * higher or lower that the previous country in terms of ranking order (size, population, etc.).
 *
 * Some quiz types are inherently easier than others, so may want to balance difficulty somehow,
 * maybe by granting a different number of additional submissions.
 */
export type QuizType = "MATCH_TO_CURRENCIES" | "MATCH_TO_BORDERING_COUNTRIES"
    | "MATCH_TO_CAPITALS" | "MATCH_TO_FLAGS" | "MATCH_TO_LOCATIONS" | "MATCH_TO_FUN_FACTS"
    | "ORDER_BY_SIZE" | "ORDER_BY_POPULATION" | "ORDER_BY_POPULATION_DENSITY"
    | "SORT_OUT_VALUES";

// This file needs to be .tsx so that the descriptions can include markup.
// Note that fieldToRequire must be part of the shallow data expected to already be loaded.
// Default frequency is 3.
export const QUIZ_TYPES: Record<QuizType, CountryQuiz> = {
  // Use formatted value for match value functions for easy string comparison
  MATCH_TO_CURRENCIES: {
    type: "MATCH_TO_CURRENCIES",
    description: <><strong>Match</strong> the countries to their <strong>currencies</strong>.</>,
    structure: "matching",
    singleCapacity: true,
    matchTypeLabel: "Country Currencies",
    valueArrayFunction: (storedCountryData: CountryStorage, cca3: Cca3Code) =>
        storedCountryData.countries[cca3]?.data?.currencies?.rawValue,
    valueFunction: (storedCountryData: CountryStorage, cca3: Cca3Code) =>
        storedCountryData.countries[cca3]?.data?.currencies?.formattedValue ?? "Unknown",
    labelFunction: (storedCountryData: CountryStorage, cca3: Cca3Code) =>
        storedCountryData.countries[cca3]?.data?.currencies?.markupValue ?? "Unknown",
  },
  MATCH_TO_BORDERING_COUNTRIES: {
    type: "MATCH_TO_BORDERING_COUNTRIES",
    description: <><strong>Match</strong> the countries to their <strong>bordering countries</strong>.</>,
    structure: "matching",
    singleCapacity: false,
    matchTypeLabel: "Bordering Countries",
    valueArrayFunction: (storedCountryData: CountryStorage, cca3: Cca3Code) =>
        storedCountryData.countries[cca3]?.data?.borders,
    // Comma separated list of bordering country codes or "None"
    valueFunction: (storedCountryData: CountryStorage, cca3: Cca3Code) =>
        formatCountryDataArray(storedCountryData.countries[cca3]?.data?.borders),
    // Name of the country
    labelFunction: (storedCountryData: CountryStorage, cca3: Cca3Code) =>
        getCountryNameFromCode(cca3, storedCountryData.countries),
  },
  MATCH_TO_FUN_FACTS: {
    type: "MATCH_TO_FUN_FACTS",
    description: <><strong>Match</strong> the countries to their <strong>fun facts</strong>.</>,
    structure: "matching",
    singleCapacity: true,
    matchTypeLabel: "Country Fun Facts",
    fieldToRequire: "funFacts",
    valueArrayFunction: (storedCountryData: CountryStorage, cca3: Cca3Code) =>
        storedCountryData.countries[cca3]?.data?.funFacts,
    valueFunction: (storedCountryData: CountryStorage, cca3: Cca3Code, index = 0) =>
        storedCountryData.countries[cca3]?.data?.funFacts?.[index] ?? "Error",
    labelFunction: (storedCountryData: CountryStorage, cca3: Cca3Code, index = 0) =>
        storedCountryData.countries[cca3]?.data?.funFacts?.[index] ?? "Error",
  },
  MATCH_TO_CAPITALS: {
    type: "MATCH_TO_CAPITALS",
    description: <><strong>Match</strong> the countries to their <strong>capitals</strong>.</>,
    structure: "matching",
    singleCapacity: true,
    matchTypeLabel: "Country Capitals",
    valueArrayFunction: (storedCountryData: CountryStorage, cca3: Cca3Code) =>
        storedCountryData.countries[cca3]?.data?.capitals?.rawValue,
    valueFunction: (storedCountryData: CountryStorage, cca3: Cca3Code) =>
        storedCountryData.countries[cca3]?.data?.capitals?.formattedValue ?? "Unknown",
    labelFunction: (storedCountryData: CountryStorage, cca3: Cca3Code) =>
        storedCountryData.countries[cca3]?.data?.capitals?.formattedValue ?? "Unknown",
  },
  MATCH_TO_FLAGS: {
    type: "MATCH_TO_FLAGS",
    description: <><strong>Match</strong> the countries to their <strong>flags</strong>.</>,
    structure: "matching",
    singleCapacity: true,
    matchTypeLabel: "Country Flags",
    // Not really necessary for flags after manually gathering replacements
    // for the missing flag descriptions, but might as well just in case
    fieldToRequire: "flagDescription",
    valueFunction: (storedCountryData: CountryStorage, cca3: Cca3Code) =>
        storedCountryData.countries[cca3]?.data?.flagDescription ?? "Unknown",
    labelFunction: (storedCountryData: CountryStorage, cca3: Cca3Code) =>
        storedCountryData.countries[cca3]?.data?.flagDescription ?? "Unknown",
  },
  MATCH_TO_LOCATIONS: {
    type: "MATCH_TO_LOCATIONS",
    description: <><strong>Match</strong> the countries to their <strong>locations</strong>.</>,
    structure: "matching",
    singleCapacity: true,
    matchTypeLabel: "Country Locations",
    valueFunction: (storedCountryData: CountryStorage, cca3: Cca3Code) =>
        storedCountryData.countries[cca3]?.data?.location ?? "Unknown",
    labelFunction: (storedCountryData: CountryStorage, cca3: Cca3Code) =>
        storedCountryData.countries[cca3]?.data?.location ?? "Unknown",
  },
  ORDER_BY_SIZE: {
    type: "ORDER_BY_SIZE",
    description: <><strong>Order</strong> the countries by <strong>size</strong>, largest first.</>,
    structure: "ranking",
    rankingTypeLabel: "Size",
    valueFunction: (storedCountryData: CountryStorage, cca3: Cca3Code) =>
        storedCountryData.countries[cca3]?.data?.area?.rawValue ?? 0,
    labelFunction: (storedCountryData: CountryStorage, independentOnly: boolean, cca3: Cca3Code) => {
      if (independentOnly) {
        return storedCountryData.countries[cca3]?.data?.area?.formattedValueForIndependentOnly ?? 0;
      } else {
        return storedCountryData.countries[cca3]?.data?.area?.formattedValueForAll ?? 0;
      }
    },
  },
  ORDER_BY_POPULATION: {
    type: "ORDER_BY_POPULATION",
    frequency: 2,
    description: <><strong>Order</strong> the countries by <strong>total population</strong>, largest first.</>,
    structure: "ranking",
    rankingTypeLabel: "Total Population",
    valueFunction: (storedCountryData: CountryStorage, cca3: Cca3Code) =>
        storedCountryData.countries[cca3]?.data?.population?.rawValue ?? 0,
    labelFunction: (storedCountryData: CountryStorage, independentOnly: boolean, cca3: Cca3Code) => {
      if (independentOnly) {
        return storedCountryData.countries[cca3]?.data?.population?.formattedValueForIndependentOnly ?? 0;
      } else {
        return storedCountryData.countries[cca3]?.data?.population?.formattedValueForAll ?? 0;
      }
    },
  },
  ORDER_BY_POPULATION_DENSITY: {
    type: "ORDER_BY_POPULATION_DENSITY",
    frequency: 1,
    description: <><strong>Order</strong> the countries by <strong>population density</strong>, largest first.</>,
    structure: "ranking",
    rankingTypeLabel: "Population Density",
    valueFunction: (storedCountryData: CountryStorage, cca3: Cca3Code) =>
        storedCountryData.countries[cca3]?.data?.populationDensity?.rawValue ?? 0,
    labelFunction: (storedCountryData: CountryStorage, independentOnly: boolean, cca3: Cca3Code) => {
      if (independentOnly) {
        return storedCountryData.countries[cca3]?.data?.populationDensity?.formattedValueForIndependentOnly ?? 0;
      } else {
        return storedCountryData.countries[cca3]?.data?.populationDensity?.formattedValueForAll ?? 0;
      }
    },
  },
  SORT_OUT_VALUES: {
    type: "SORT_OUT_VALUES",
    frequency: 9,
    description: <><strong>Sort out</strong> the correct</>,
    structure: "sortingOut",
  },
};

export interface MatchingQuiz {
  type: QuizType;
  frequency?: number;
  description: React.ReactNode;
  structure: "matching";
  singleCapacity: boolean;
  matchTypeLabel: string;
  fieldToRequire?: keyof StoredCountry;
  valueArrayFunction?: (storedCountryData: CountryStorage, cca3: Cca3Code) => string[] | undefined;
  valueFunction: (storedCountryData: CountryStorage, cca3: Cca3Code, index?: number) => string;
  labelFunction: (storedCountryData: CountryStorage, cca3: Cca3Code, index?: number) => React.ReactNode;
};

export interface RankingQuiz {
  type: QuizType;
  frequency?: number;
  description: React.ReactNode;
  structure: "ranking";
  rankingTypeLabel: string;
  fieldToRequire?: keyof StoredCountry;
  valueFunction: (storedCountryData: CountryStorage, cca3: Cca3Code) => number;
  labelFunction: (storedCountryData: CountryStorage, independentOnly: boolean,
      cca3: Cca3Code) => React.ReactNode;
};

export interface SortingOutQuiz {
  type: QuizType;
  frequency?: number;
  description: React.ReactNode;
  structure: "sortingOut";
}

export type CountryQuiz = MatchingQuiz | RankingQuiz | SortingOutQuiz;

export interface MatchingQuizState {
  quiz: MatchingQuiz;
  submissionsRemaining: number;
  roundStartSubmissionsRemaining: number;
  round: number;
  level: number;
  countryCodes: Cca3Code[];
  countryCodesOverride?: Cca3Code[]; // For bordering country quizzes
  // Have to match the structure of matchedCountryCodes
  countryCodeSecondaryIndexes?: number[]; // For fun fact quizzes
  countryCodesLockedInAsCorrect: Partial<Record<number, Cca3Code[]>>;
  incorrectSubmissions: [string, Cca3Code[]][][];

  // Use sorted match value index as the key to allow for duplicate values.
  // Use Object.values().flat() to get the matched country codes/count.
  matchedCountryCodes: Partial<Record<number, Cca3Code[]>>;
};

export interface RankingQuizState {
  quiz: RankingQuiz;
  submissionsRemaining: number;
  roundStartSubmissionsRemaining: number;
  round: number;
  level: number;
  countryCodes: Cca3Code[];
  countryCodesLockedInAsCorrect: Cca3Code[];
  incorrectSubmissions: Cca3Code[][];
  rankedCountryCodes: Cca3Code[];
};

export interface SortingOutQuizState {
  quiz: SortingOutQuiz;
  submissionsRemaining: number;
  roundStartSubmissionsRemaining: number;
  round: number;
  level: number;

  // For easy integration with other quiz type handling
  countryCodes: Cca3Code[];
  countryCodesLockedInAsCorrect: Cca3Code[];

  // Copy over the country group values rather than referencing them directly,
  // so that country group edits don't disrupt in-progress quizzes
  countryGroupNameOverride?: string;
  countryFields: (keyof StoredCountry)[];
  countryFieldsLockedInAsCorrect: Partial<Record<Cca3Code, (keyof StoredCountry)[]>>;

  // I'm not sure why I used Object.entries to store incorrectSubmissions for other quiz types,
  // but this seems to work...
  incorrectSubmissions: Partial<Record<Cca3Code, Partial<Record<keyof StoredCountry, Cca3Code>>>>[];

  // For each country code key, you have an object for the country's fields,
  // whose value is the matched country code rather than the actual field value
  matchedCountryFields: Partial<Record<Cca3Code, Partial<Record<keyof StoredCountry, Cca3Code>>>>;
}

export type QuizState = MatchingQuizState | RankingQuizState | SortingOutQuizState;

// For quizzing on related or often confused countries.
// Best to stick to sizes of 2, 3, or 7.  Try to keep a relatively even ratio of 2s and 3s.
// NI = not independent.
export const COUNTRY_GROUPS: CountryGroup[] = [
  {
    // Thailand/Taiwan (NI)
    countryCodes: ["THA", "TWN"],
  }, {
    // Paraguay/Uruguay
    countryCodes: ["PRY", "URY"],
  }, {
    // British/US Virgin Islands (NI)
    countryCodes: ["VGB", "VIR"],
  }, {
    // Yemen/Oman
    countryCodes: ["YEM", "OMN"],
  }, {
    // Mauritania/Mauritius
    countryCodes: ["MRT", "MUS"],
  }, {
    // Niger/Nigeria
    countryCodes: ["NER", "NGA"],
  }, {
    // North/South Korea
    countryCodes: ["PRK", "KOR"],
  }, {
    // South Sudan/Sudan
    countryCodes: ["SSD", "SDN"],
  }, {
    // DR Congo/Republic of the Congo
    countryCodes: ["COD", "COG"],
  }, {
    // Saint Martin/Sint Maarten (NI)
    countryCodes: ["MAF", "SXM"],
  }, {
    // Hong Kong/Macau (NI)
    countryCodes: ["HKG", "MAC"],
  }, {
    // Tuvalu/Vanuatu
    countryCodes: ["TUV", "VUT"],
  }, {
    // Guernsey/Jersey (NI)
    countryCodes: ["GGY", "JEY"],
  }, {
    // Luxembourg/Liechtenstein
    countryCodes: ["LUX", "LIE"],
  }, {
    // San Marino/Vatican City
    countryCodes: ["SMR", "VAT"],
  }, {
    // Andorra/Monaco
    countryCodes: ["AND", "MCO"],
  }, {
    // Seychelles/Maldives
    countryCodes: ["SYC", "MDV"],
  }, {
    // Austria/Australia
    countryCodes: ["AUT", "AUS"],
  }, {
    // Mali/Malawi
    countryCodes: ["MLI", "MWI"],
  }, {
    // Bangladesh/Bhutan
    countryCodes: ["BGD", "BTN"],
  }, {
    // Burundi/Bahrain/Brunei
    countryCodes: ["BDI", "BHR", "BRN"],
  }, {
    // Guyana/Suriname/French Guiana (NI)
    countryCodes: ["GUY", "SUR", "GUF"],
  }, {
    // Lebanon/Libya/Liberia
    countryCodes: ["LBN", "LBY", "LBR"],
  }, {
    // Iraq/Iran/Afghanistan
    countryCodes: ["IRQ", "IRN", "AFG"],
  }, {
    // Slovakia/Slovenia/Serbia
    countryCodes: ["SVK", "SVN", "SRB"],
  }, {
    //Bolivia/Botswana/Bosnia and Herzegovina
    countryCodes: ["BOL", "BWA", "BIH"],
  }, {
    // Georgia/Armenia/Azerbaijan
    countryCodes: ["GEO", "ARM", "AZE"],
  }, {
    // Estonia/Latvia/Lithuania
    nameOverride: "The Baltics",
    countryCodes: ["EST", "LVA", "LTU"],
  }, {
    // Greenland/Iceland/Ireland (NI)
    countryCodes: ["GRL", "ISL", "IRL"],
  }, {
    // Gambia/Zambia/Zimbabwe
    countryCodes: ["GMB", "ZMB", "ZWE"],
  }, {
    // Dominica/Dominican Republic/Haiti
    countryCodes: ["DMA", "DOM", "HTI"],
  }, {
    // Samoa/American Samoa/Guam (NI)
    countryCodes: ["WSM", "ASM", "GUM"],
  }, {
    // Equatorial Guinea/Guinea/Guinea-Bissau
    nameOverride: 'The African "Guineas"',
    countryCodes: ["GNQ", "GIN", "GNB"],
  }, {
    // Myanmar/Thailand/Laos/Cambodia/Vietnam/Singapore/Malaysia
    nameOverride: "Mainland Southeast Asia",
    countryCodes: ["MMR", "THA", "LAO", "KHM", "VNM", "SGP", "MYS"],
  }, {
    // Belize/Costa Rica/El Salvador/Guatemala/Honduras/Nicaragua/Panama
    nameOverride: "Central America",
    countryCodes: ["BLZ", "CRI", "SLV", "GTM", "HND", "NIC", "PAN"],
  }, {
    // Afghanistan/Kazakhstan/Kyrgyzstan/Pakistan/Tajikistan/Turkmenistan/Uzbekistan
    nameOverride: 'The "Stans"',
    countryCodes: ["AFG", "KAZ", "KGZ", "PAK", "TJK", "TKM", "UZB"],
  }, {
    // Saint Barthélemy/Saint Helena, Ascension and Tristan da Cunha/Saint Kitts and Nevis
    // /Saint Lucia/Saint Martin/Saint Pierre and Miquelon/Saint Vincent and the Grenadines (NI)
    nameOverride: 'The "Saints"',
    countryCodes: ["BLM", "SHN", "KNA", "LCA", "MAF", "SPM", "VCT"],
  }, {
    // Aland Islands/Denmark/Faroe Islands/Finland/Iceland/Sweden/Norway (NI)
    nameOverride: "The Nordic Crosses",
    countryCodes: ["ALA", "DNK", "FRO", "FIN", "ISL", "SWE", "NOR"],
  },
];

// Prioritize these fields, but allow any of them to be used
export const SORTING_OUT_QUIZ_PRIORITY_FIELDS: (keyof StoredCountry)[] = [
  "location",
  "flagDescription",
  "capitals",
];

// Unused with current settings
export const SORTING_OUT_QUIZ_EXTRA_FIELDS: (keyof StoredCountry)[] = [
  "currencies",
  /* "area",
  "population",
  "populationDensity", */
];
