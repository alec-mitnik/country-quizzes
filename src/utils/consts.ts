import type { CountryStorage } from "../CountriesProvider";

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
export const PORTFOLIO_LINK_ACCESSIBLE_NAME = "Check out my other projects";
export const PORTFOLIO_URL = "https://alec-mitnik.github.io/";

export const COUNTRIES_SEARCH_ACCESSIBLE_NAME = "Filter countries by name";

export const LOADING_MESSAGE = "Loading...";
export const NO_COUNTRIES_LOADED_MESSAGE = "No countries could be loaded";
export const NO_COUNTRIES_MATCHED_MESSAGE = "No countries match your search";

export const NO_COUNTRY_DATA_MESSAGE = "Country data not found";
export const BACK_TO_COUNTRIES_LINK_TEXT = "Back to Countries";

export const QUIZ_INSTRUCTIONS_SUBHEADER = "How to Play";
export const QUIZ_STARTING_COUNTRY_COUNT = 3;
export const QUIZ_STARTING_SUBMISSIONS_COUNT = 6;
export const QUIZ_COUNTRY_COUNT_INCREASE = 1;
export const QUIZ_SUBMISSION_COUNT_INCREASE = 6;

export const DEFAULT_COUNTRY_STORAGE: CountryStorage = {
  countries: {},
  rankings: {
    independentOnly: {
      byArea: [],
      byPopulation: [],
    },
    all: {
      byArea: [],
      byPopulation: [],
    }
  },
  shallowDataRequested: false,
  shallowDataLoaded: false,
};
