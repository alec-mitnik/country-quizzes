import type { Cca3Code } from "@yusifaliyevpro/countries/types";
import type { StoredCountry } from "../../types/commonTypes";
import type { CountryStorage } from "../CountriesProvider";
import { formatCountryDataArray } from "../utils/countryUtils";

// Increment this any time a breaking change is introduce to quiz data
// so that preexisting data will be completely discarded rather than cause an error
export const QUIZ_BREAKING_VERSION = 1;

// Increment this any time a breaking change is introduce to quiz round data
// so that only preexisting data for the current round will be discarded
export const QUIZ_ROUND_BREAKING_VERSION = 1;

/*
 * TODO:
 *
 * Sound effects?
 *
 *
 * Ideas:
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
 * Might be fun to have special challenge rounds for all consecutive ranks, all similar flags,
 * or touring locations throughout regions.  Maybe all countries that end in "stan" and the like.
 * Challenge rounds could take place at the end of each level, after which you earn a bonus,
 * though this would conflict with obscurity filtering, and independence filtering would affect it too...
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
 * Challenge rounds could just be one-off quizzes, maybe with a daily rotation
 * to encourage daily play.  Would need to be playable without interrupting a main run, though.
 *
 * Interesting country pairs/groups for challenge rounds:
 * - All countries that end in "stan"
 * - All countries that start with "saint"
 * - Central America
 * - South America
 * - Caribbean
 * - Certain flag groups like Nordic countries
 * - Baltics (Estonia/Latvia/Lithuania)
 * - South Asia (Myanmar/Cambodia/Thailand/Vietnam)
 * - Southeast Asia (Indonesia/Malaysia/Philippines/Singapore/Timor-Leste/Brunei/Papua New Guinea/etc.)
 * - Thailand/Taiwan
 * - Paraguay/Uruguay
 * - Slovakia/Slovenia
 * - British/US Virgin Islands
 * - Samoa/American Samoa or American Samoa/Guam
 * - Equatorial Guinea/Guinea/Guinea-Bissau and maybe Papua New Guinea
 * - Mauritania/Mauritius
 * - Niger/Nigeria
 * - North/South Korea
 * - South Sudan/Sudan
 * - DR Congo/Republic of the Congo
 * - Saint Martin/Sint Maarten
 * - Hong Kong/Macau
 * - Tuvalu/Vanuatu
 * - Dominica/Dominican Republic or Dominican Republic/Haiti
 * - Yemen/Oman
 * - Guernsey/Jersey
 * - Luxembourg/Liechtenstein
 * - San Marino/Vatican City
 * - Iraq/Iran
 * - Seychelles/Maldives
 * - Austria/Australia
 * - Guyana/French Guiana
 * - Gambia/Zambia or Zambia/Zimbabwe
 * - Greenland/Iceland or maybe Iceland/Ireland
 * - Armenia/Azerbaijan
 *
 * New quiz type for country pairs, to assign all their values correctly
 *
 * Could track correct/incorrect submissions per country in local storage,
 * and show stats on how well you know each country.
 */

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
    | "ORDER_BY_SIZE" | "ORDER_BY_POPULATION" | "ORDER_BY_POPULATION_DENSITY";

export interface MatchingQuiz {
  type: QuizType;
  description: string;
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
  description: string;
  structure: "ranking";
  rankingTypeLabel: string;
  fieldToRequire?: keyof StoredCountry;
  valueFunction: (storedCountryData: CountryStorage, cca3: Cca3Code) => number;
  labelFunction: (storedCountryData: CountryStorage, independentOnly: boolean,
      cca3: Cca3Code) => React.ReactNode;
};

export type CountryQuiz = MatchingQuiz | RankingQuiz;

// Note that fieldToRequire must be part of the shallow data expected to already be loaded
export const QUIZ_TYPES: Record<QuizType, CountryQuiz> = {
  // Use formatted value for match value functions for easy string comparison
  MATCH_TO_CURRENCIES: {
    type: "MATCH_TO_CURRENCIES",
    description: "Match the countries to their currency.",
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
    description: "Match the countries to their bordering countries.",
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
        storedCountryData.countries[cca3]?.data?.name ?? cca3,
  },
  MATCH_TO_FUN_FACTS: {
    type: "MATCH_TO_FUN_FACTS",
    description: "Match the countries to their fun facts.",
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
    description: "Match the countries to their capitals.",
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
    description: "Match the countries to their flags.",
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
    description: "Match the countries to their locations.",
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
    description: "Order the countries by size, largest first.",
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
    description: "Order the countries by total population, largest first.",
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
    description: "Order the countries by population density, largest first.",
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
};

export interface MatchingQuizState {
  quiz: MatchingQuiz;
  submissionsRemaining: number;
  roundStartSubmissionsRemaining: number;
  countryCodes: Cca3Code[];
  countryCodesOverride?: Cca3Code[]; // For bordering country quizzes
  // Have to match the structure of matchedCountryCodes
  countryCodeSecondaryIndexes?: number[]; // For fun fact quizzes
  countryCodesLockedInAsCorrect: Partial<Record<number, Cca3Code[]>>;
  round: number;
  level: number;
  incorrectSubmissions: [string, Cca3Code[]][][];

  // Use sorted match value index as the key to allow for duplicate values.
  // Use Object.values().flat() to get the matched country codes/count.
  matchedCountryCodes: Partial<Record<number, Cca3Code[]>>;
};

export interface RankingQuizState {
  quiz: RankingQuiz;
  submissionsRemaining: number;
  roundStartSubmissionsRemaining: number;
  countryCodes: Cca3Code[];
  countryCodesLockedInAsCorrect: Cca3Code[];
  round: number;
  level: number;
  incorrectSubmissions: Cca3Code[][];
  rankedCountryCodes: Cca3Code[];
};

export type QuizState = MatchingQuizState | RankingQuizState;
