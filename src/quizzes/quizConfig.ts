import type { Cca3Code } from "@yusifaliyevpro/countries/types";
import type { CountryStorage, StoredCountry } from "../CountriesProvider";

/*
 * TODO - ideas:
 *
 * Provide a more hands-on tutorial that introduces the mechanics one by one.
 * Add hint/reminder messaging.
 *
 * Maybe there's an API for country fun facts that I could use to pepper in interesting trivia.
 *
 * Maybe more roguelike elements could be introduced, like items and bonuses that
 * reveal more values of the countries involved (languages, currencies, continent, etc.),
 * or submit a country correctly for you, or reveal all info for locked-in ranked countries.
 * Bonuses could be earned for feats like beating a round in one attempt or
 * getting countries with consecutive ranks correct in one try.
 *
 * Instead of random quiz types, could offer a choice of several random options.
 *
 * Might be fun to have special challenge rounds for all consecutive ranks or all similar flags.
 * Challenge rounds could take place at the end of each level, after which you earn a bonus.
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
 * Offer a way to practice specific quiz types, doing a single level at a time
 * (But how to set the difficulty level?).
 *
 * Groups of similar flags:
 * Palestine, Jordan, Sudan, South Sudan, Kuwait, UAE, Western Sahara, (Bahamas, Martinique, Zimbabwe)
 * Indonesia, Monaco, Poland, Singapore, Greenland, (Austria, Peru, Chile, Czechia, Latvia, Lebanon, Malta)
 * Ireland, Ivory Coast, India, Niger
 * Germany, Belgium, Uganda, (Zimbabwe, Zambia)
 * Armenia, Colombia, Ecuador, Mauritius, Venezuela (similar to below group)
 * Andorra, Moldova, Romania, Chad (similar to above group)
 * Italy, Mexico, (Ireland, similar to below group)
 * Bulgaria, Equatorial Guinea, Iran, Hungary, Kuwait, Tajikistan, (Madagascar, Oman, similar to above group)
 * Australia/Heard Island and McDonald Islands, New Zealand, Cook Islands, (Tuvalu, similar to below group)
 * Anguilla, British Virgin Islands, Cayman Islands, Falkland Islands, Montserrat, Pitcairn Islands,
 *     "Saint Helena, Ascension, and Tristan da Cunha", South Georgia, Turks and Caicos Islands, (Fiji, similar to above group)
 * Netherlands, Russia, Paraguay, Slovenia, Slovakia, (Croatia, Costa Rica, Luxembourg, France/Saint Martin)
 * Sint Maarten, Philippines, (Haiti, Lichtenstein)
 * Argentina, Nicaragua, Honduras, El Salvador, (Guatemala)
 * Mali, Guinea, Senegal, Cameroon, (Myanmar, Ghana, Burkina Faso, Lithuania),
 *     [French Guiana, Guinea-Bissau], [Bolivia, Ethiopia, Mauritius, Republic of the Congo, Togo]
 * Vietnam, Morocco, Hong Kong, Isle of Man, Tunisia, Turkey, China, Kyrgyzstan, (Albania, Montenegro)
 * Saint Kitts and Nevis, Namibia, DR Congo, Trinidad and Tobago, Tanzania, (Republic of the Congo)
 * Iceland, Norway/Bouvet Island/Svalbard and Jan Mayen, Iceland, Finland, Denmark, Åland Islands, Sweden, Faroe Islands
 * United States/United States Minor Outlying Islands, Liberia, Malaysia, (Puerto Rico), [Cuba]
 * Yemen, Iraq, Syria, Egypt, (Sudan)
 * Taiwan, Samoa, Tonga, Lichtenstein, (Haiti, Wallis and Futuna)
 *
 * Could track correct/incorrect submissions per country in local storage,
 * and show stats on how well you know each country.
 */

/*
 * More types can be added in the future, like grouping countries into categories,
 * such as independent or not, has a star on its flag, is landlocked, is an island (no bordering countries),
 * higher or lower than the median population density, hemisphere, etc.
 *
 * Another type could be showing countries in a fixed order, and having to mark them as
 * higher or lower that the previous country in terms of ranking order (size, population, etc.).
 *
 * Some quiz types would inherently easier than others, so may want to balance difficulty somehow.
 */
export type QuizType = "MATCH_TO_CURRENCIES" | "MATCH_TO_CAPITALS" | "MATCH_TO_FLAGS"
    | "MATCH_TO_LOCATIONS" | "ORDER_BY_SIZE" | "ORDER_BY_POPULATION"
    | "ORDER_BY_POPULATION_DENSITY";

// TODO - grouping quiz types, etc.
export interface MatchingQuiz {
  type: QuizType;
  description: string;
  structure: "matching";
  matchTypeLabel: string;
  fieldToRequire?: keyof StoredCountry;
  valueFunction: (storedCountryData: CountryStorage, cca3: Cca3Code) => string;
  labelFunction: (storedCountryData: CountryStorage, cca3: Cca3Code) => React.ReactNode;
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

// TODO - could match on bordering countries, or rank by number of bordering countries,
// latitude (actually quite ambiguous in its calculation and maybe not good to quiz on)...

// Note that fieldToRequire must be part of the shallow data expected to already be loaded
export const QUIZ_TYPES: Record<QuizType, MatchingQuiz | RankingQuiz> = {
  // Use formatted value for match value functions for easy string comparison
  MATCH_TO_CURRENCIES: {
    type: "MATCH_TO_CURRENCIES",
    description: "Match the countries to their currency.",
    structure: "matching",
    matchTypeLabel: "Currencies",
    valueFunction: (storedCountryData: CountryStorage, cca3: Cca3Code) =>
        storedCountryData.countries[cca3]?.data?.currencies?.formattedValue ?? "Unknown",
    labelFunction: (storedCountryData: CountryStorage, cca3: Cca3Code) =>
        storedCountryData.countries[cca3]?.data?.currencies?.markupValue ?? "Unknown",
  },
  MATCH_TO_CAPITALS: {
    type: "MATCH_TO_CAPITALS",
    description: "Match the countries to their capitals.",
    structure: "matching",
    matchTypeLabel: "Capitals",
    valueFunction: (storedCountryData: CountryStorage, cca3: Cca3Code) =>
        storedCountryData.countries[cca3]?.data?.capitals?.formattedValue ?? "Unknown",
    labelFunction: (storedCountryData: CountryStorage, cca3: Cca3Code) =>
        storedCountryData.countries[cca3]?.data?.capitals?.formattedValue ?? "Unknown",
  },
  MATCH_TO_FLAGS: {
    type: "MATCH_TO_FLAGS",
    description: "Match the countries to their flags.",
    structure: "matching",
    matchTypeLabel: "Flags",
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
    matchTypeLabel: "Locations",
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

export interface QuizState {
  quiz: MatchingQuiz | RankingQuiz;
  submissionsRemaining: number;
  countryCodes: Cca3Code[];
  countryCodesLockedInAsCorrect: Cca3Code[];
  countryCount: number;
  round: number;
  level: number;
  incorrectSubmissions: Cca3Code[][];
};
