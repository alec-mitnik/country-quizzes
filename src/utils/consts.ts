import type { CountryStorage } from "../CountriesProvider";
import supplementalCountryData from "../supplementalData/supplementalCountryData.json";

export const SETTINGS_BAR_ACCESSIBLE_NAME = "Settings Bar";
export const INDEPENDENT_COUNTRIES_CHECKBOX_LABEL = "Independent Countries Only";

export const APP_TITLE = "Country Quizzes";
export const COUNTRIES_TITLE = "Countries";
export const QUIZ_TITLE = "Quiz!"
export const NO_PAGE_TITLE = "404: Page Not Found";

export const HOME_NAV_TEXT = "Home";
export const COUNTRIES_NAV_TEXT = COUNTRIES_TITLE;
export const QUIZ_NAV_TEXT = QUIZ_TITLE;

export const HOME_SUBHEADER = "By Alec Mitnik";
export const REST_COUNTRIES_API_LINK_TEXT = "REST Countries API";
export const REST_COUNTRIES_API_LINK_URL = "https://restcountries.com/";
export const CIA_WORLD_FACTBOOK_LINK_TEXT = "CIA World Factbook";
export const CIA_WORLD_FACTBOOK_LINK_URL = "https://www.cia.gov/the-world-factbook/countries/";
export const PORTFOLIO_LINK_ACCESSIBLE_NAME = "Check out my other projects";
export const PORTFOLIO_URL = "https://alec-mitnik.github.io/";

export const COUNTRIES_SORT_BY_ACCESSIBLE_NAME = "Sort countries by";
export const COUNTRIES_SEARCH_ACCESSIBLE_NAME = "Filter countries by name";

export const LOADING_MESSAGE = "Loading...";
export const LOADING_IMAGE_MESSAGE = "Loading Image...";
export const NO_COUNTRIES_LOADED_MESSAGE = "No countries could be loaded";
export const NO_COUNTRIES_MATCHED_MESSAGE = "No countries match your search";

export const NO_COUNTRY_DATA_MESSAGE = "Country data not found";
export const BACK_TO_COUNTRIES_LINK_TEXT = "Back to Countries";

export const QUIZ_INSTRUCTIONS_SUBHEADER = "How to Play";
export const QUIZ_ONE_GO_TIP = "You needn't submit the full answer for the round in one go! It may be better to lock it in piece by piece.";
export const QUIZ_STARTING_COUNTRY_COUNT = 3;
export const QUIZ_STARTING_SUBMISSIONS_COUNT = 8;
export const QUIZ_COUNTRY_COUNT_INCREASE = 1;
export const QUIZ_SUBMISSION_COUNT_INCREASE_PER_ROUND = 3;
export const QUIZ_SUBMISSION_COUNT_INCREASE_PER_LEVEL = 5;
export const QUIZ_ROUNDS_PER_LEVEL = 5;
export const QUIZ_MAX_LEVEL = 10;

// Prevent match type quizzes from having all the same match values
export const QUIZ_MAX_DUPLICATE_MATCH_VALUES = 2;

export const SQUARE_KM_PER_SQUARE_MILE = 2.58998811;
export const CUSTOM_DRAG_TYPE = 'application/country-code';

export const DEFAULT_COUNTRY_STORAGE: CountryStorage = {
  countries: supplementalCountryData,
  rankings: {
    independentOnly: {
      byArea: [],
      byPopulation: [],
      byPopulationDensity: [],
      byFamiliarity: [],
    },
    all: {
      byArea: [],
      byPopulation: [],
      byPopulationDensity: [],
      byFamiliarity: [],
    }
  },
  shallowDataRequested: false,
  shallowDataLoaded: false,
};
