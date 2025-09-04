import type { Cca3Code } from "@yusifaliyevpro/countries/types";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { CountryStorage, StoredCountry } from "../CountriesProvider";
import useCountries from "../hooks/useCountries";
import QuizControlsForMatching from "../quizzes/QuizControlsForMatching";
import QuizControlsForRanking from "../quizzes/QuizControlsForRanking";
import RenderWithLoading from "../RenderWithLoading";
import {
  INDEPENDENT_COUNTRIES_CHECKBOX_LABEL,
  QUIZ_COUNTRY_COUNT_INCREASE,
  QUIZ_INSTRUCTIONS_SUBHEADER, QUIZ_MAX_LEVEL, QUIZ_ROUNDS_PER_LEVEL, QUIZ_STARTING_COUNTRY_COUNT,
  QUIZ_STARTING_SUBMISSIONS_COUNT, QUIZ_SUBMISSION_COUNT_INCREASE_PER_LEVEL, QUIZ_SUBMISSION_COUNT_INCREASE_PER_ROUND, QUIZ_TITLE
} from "../utils/consts";
import { extractRandomArrayElement, getRandomArrayElement } from "../utils/utils";
import Page from "./Page";
import "./Quiz.css";

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
export type QuizTypeKey = "MATCH_TO_CURRENCIES" | "MATCH_TO_CAPITALS" | "MATCH_TO_FLAGS" | "MATCH_TO_LOCATIONS"
    | "ORDER_BY_SIZE" | "ORDER_BY_POPULATION" | "ORDER_BY_POPULATION_DENSITY";

// TODO - grouping quiz types, etc.
export interface MatchingQuizType {
  key: QuizTypeKey;
  description: string;
  structure: "matching";
  matchTypeLabel: string;
  fieldToRequire?: keyof StoredCountry;
  valueFunction: (storedCountryData: CountryStorage, cca3: Cca3Code) => string;
  labelFunction: (storedCountryData: CountryStorage, cca3: Cca3Code) => React.ReactNode;
};

export interface RankingQuizType {
  key: QuizTypeKey;
  description: string;
  structure: "ranking";
  rankingTypeLabel: string;
  fieldToRequire?: keyof StoredCountry;
  valueFunction: (storedCountryData: CountryStorage, cca3: Cca3Code) => number;
  labelFunction: (storedCountryData: CountryStorage, independentOnly: boolean,
      cca3: Cca3Code) => React.ReactNode;
};

// TODO - could rank by population density, number of bordering countries,
// latitude (actually quite ambiguous in its calculation and maybe not good to quiz on)...

// Note that fieldToRequire must be part of the shallow data expected to already be loaded
const QUIZ_TYPES: Record<QuizTypeKey, MatchingQuizType | RankingQuizType> = {
  // Use formatted value for match value functions for easy string comparison
  MATCH_TO_CURRENCIES: {
    key: "MATCH_TO_CURRENCIES",
    description: "Match the countries to their currency.",
    structure: "matching",
    matchTypeLabel: "Currencies",
    valueFunction: (storedCountryData: CountryStorage, cca3: Cca3Code) =>
        storedCountryData.countries[cca3]?.data?.currencies?.formattedValue ?? "Unknown",
    labelFunction: (storedCountryData: CountryStorage, cca3: Cca3Code) =>
        storedCountryData.countries[cca3]?.data?.currencies?.markupValue ?? "Unknown",
  },
  MATCH_TO_CAPITALS: {
    key: "MATCH_TO_CAPITALS",
    description: "Match the countries to their capitals.",
    structure: "matching",
    matchTypeLabel: "Capitals",
    valueFunction: (storedCountryData: CountryStorage, cca3: Cca3Code) =>
        storedCountryData.countries[cca3]?.data?.capitals?.formattedValue ?? "Unknown",
    labelFunction: (storedCountryData: CountryStorage, cca3: Cca3Code) =>
        storedCountryData.countries[cca3]?.data?.capitals?.formattedValue ?? "Unknown",
  },
  MATCH_TO_FLAGS: {
    key: "MATCH_TO_FLAGS",
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
    key: "MATCH_TO_LOCATIONS",
    description: "Match the countries to their locations.",
    structure: "matching",
    matchTypeLabel: "Locations",
    valueFunction: (storedCountryData: CountryStorage, cca3: Cca3Code) =>
        storedCountryData.countries[cca3]?.data?.location ?? "Unknown",
    labelFunction: (storedCountryData: CountryStorage, cca3: Cca3Code) =>
        storedCountryData.countries[cca3]?.data?.location ?? "Unknown",
  },
  ORDER_BY_SIZE: {
    key: "ORDER_BY_SIZE",
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
    key: "ORDER_BY_POPULATION",
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
    key: "ORDER_BY_POPULATION_DENSITY",
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

function getRandomNewQuizTypeKey(currentTypeKey?: QuizTypeKey) {
  const quizTypeKeys = Object.keys(QUIZ_TYPES) as QuizTypeKey[];
  const quizTypes = quizTypeKeys.length < 2 ? quizTypeKeys
      : quizTypeKeys.filter(key => key !== currentTypeKey);
  const randomTypeKey = getRandomArrayElement<QuizTypeKey>(quizTypes);
  return randomTypeKey;
}

// Note that fieldToRequire must be part of the shallow data expected to already be loaded
function getRandomCountryCodes(independentOnly: boolean, storedCountryData: CountryStorage,
    count: number, level: number, fieldToRequire?: keyof StoredCountry) {
  const countriesData = storedCountryData.countries;
  const familiarityRankings = independentOnly ? storedCountryData.rankings.independentOnly.byFamiliarity
      : storedCountryData.rankings.all.byFamiliarity;

  let countryCodes;

  const halfMaxLevel = Math.round(QUIZ_MAX_LEVEL * 0.5);

  // Restrict to country familiarity proportional to the quiz level
  if (level <= halfMaxLevel) {
    // Level 1 involves only the top 5th most familiar countries,
    // up to level 5 involving all countries
    const familiarityLimit = Math.ceil(familiarityRankings.length * level / halfMaxLevel);
    countryCodes = familiarityRankings.slice(0, familiarityLimit);
  } else {
    // Level 6 involves all countries, up to level 10 involving
    // only the bottom 5th least familiar countries
    const familiarityThreshold = Math.floor(
        familiarityRankings.length * (level - halfMaxLevel - 1) / halfMaxLevel);
    countryCodes = familiarityRankings.slice(familiarityThreshold);
  }

  if (fieldToRequire) {
    countryCodes = countryCodes.filter(cca3 => countriesData[cca3]?.data?.[fieldToRequire]);
  }

  const selectedCountryCodes: string[] = [];

  while (countryCodes.length && count > 0) {
    selectedCountryCodes.push(extractRandomArrayElement<Cca3Code>(countryCodes));
    count--;
  }

  return selectedCountryCodes;
}

function renderQuizOutcomeMessage(quiz: Quiz) {
  if (quiz.level >= QUIZ_MAX_LEVEL && quiz.round >= QUIZ_ROUNDS_PER_LEVEL
      && quiz.countryCodesLockedInAsCorrect.length >= quiz.countryCodes.length) {
    // Cleared all 10 levels
    return "You beat the quiz! You're a country whiz.";
  } else if (quiz.level > Math.floor(QUIZ_MAX_LEVEL * 0.8)) {
    // Cleared 8 levels
    return "Amazing! You really know your stuff.";
  }else if (quiz.level > Math.floor(QUIZ_MAX_LEVEL * 0.6)) {
    // Cleared 6 levels
    return "Well done! You lasted a while.";
  } else if (quiz.level > Math.floor(QUIZ_MAX_LEVEL * 0.4)) {
    // Cleared 4 levels
    return "Not bad. Go again?";
  } else {
    return "Better luck next time.";
  }
}

interface Quiz {
  type: MatchingQuizType | RankingQuizType;
  submissionsRemaining: number;
  countryCodes: Cca3Code[];
  countryCodesLockedInAsCorrect: Cca3Code[];
  countryCount: number;
  round: number;
  level: number;
};

interface QuizState {
  quiz?: Quiz;
  countriesForQuizRoundRequested: boolean;
}

/*
 * TODO - ideas:
 *
 * Could perhaps make difficulty adjust by using less well-known countries
 * (referring to a ranking by tourism or Google Trends).  For ranking quizzes,
 * could adjust difficulty based on how close in ranking the selected countries are.
 * This seems important for better scaling, and increasing the number of countries
 * indefinitely becomes unwieldy.  Could structure it as 5 rounds per level,
 * going from 4 - 8 countries each round, then resetting, with country selection being
 * what increases difficulty between levels.
 *
 * Maybe more roguelike elements could be introduced, like items and bonuses that
 * reveal more values of the countries involved (languages, currencies, continent, etc.),
 * or submit a country correctly for you, or reveal all info for locked-in countries.
 * Bonuses could be earned for feats like beating a round in one attempt.
 *
 * Might be fun to have special challenge rounds for all consecutive ranks or
 * all similar flags, although the flag descriptions aren't always nuanced enough,
 * as Monaco and Indonesia have identical descriptions despite having different
 * aspect ratios and shades of red.  Could just manually edit one of them...
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

/**
 * Displays dynamically generated quizzes on randomly selected countries.
 * The way quizzes work, you get limited submission attempts.
 * You can choose how much to submit, and it will either lock in
 * for all correct, or fail for any incorrect.  Only relative order
 * matters for valid submission in ranking quizzes, not absolute order.
 * Quizzes gradually get harder as you progress.
 */
function Quiz() {
  const [state, setState] = useState<QuizState>({
    countriesForQuizRoundRequested: false,
  });

  const { independentOnly, storedCountryData, error, fetchShallowDataForAllCountries,
      fetchCountries } = useCountries();

  // When all countries are correctly locked in, a new round is ready to start
  const nextRoundReadyToStart = !!state.quiz
      && state.quiz.countryCodesLockedInAsCorrect.length === state.quiz.countryCodes.length;

  const quizzingActive = state.quiz
      && (state.quiz.level < QUIZ_MAX_LEVEL
          || state.quiz.round < QUIZ_ROUNDS_PER_LEVEL
          || state.quiz.countryCodesLockedInAsCorrect.length < state.quiz.countryCodes.length)
      && (nextRoundReadyToStart || state.quiz.submissionsRemaining > 0);

  const countriesForQuizRoundLoaded = useMemo(() => {
    if (!state.quiz) {
      return false;
    }

    return state.quiz.countryCodes.every(
        cca3 => storedCountryData.countries[cca3]?.fullyLoaded);
  }, [state.quiz, storedCountryData]);

  useEffect(() => {
    if (!error && !storedCountryData.shallowDataRequested) {
      // Make sure the shallow data is loaded from the get go
      fetchShallowDataForAllCountries();
    }
  }, [error, storedCountryData, fetchShallowDataForAllCountries]);

  useEffect(() => {
    if (countriesForQuizRoundLoaded && state.countriesForQuizRoundRequested) {
      // Once countries for the quiz round are loaded, reset the requested flag
      setState({
        ...state,
        countriesForQuizRoundRequested: false,
      });
    }
  }, [countriesForQuizRoundLoaded, state, setState]);

  const loadCountriesForNewQuizRound = useCallback((countryCodes: Cca3Code[]) => {
    fetchCountries(countryCodes);
  }, [fetchCountries]);

  const startNewQuiz = useCallback(() => {
    if (state.countriesForQuizRoundRequested) {
      return;
    };

    const randomQuizTypeKey = getRandomNewQuizTypeKey();
    const countryCodes = getRandomCountryCodes(independentOnly,
        storedCountryData, QUIZ_STARTING_COUNTRY_COUNT, 1,
        QUIZ_TYPES[randomQuizTypeKey].fieldToRequire);

    loadCountriesForNewQuizRound(countryCodes);

    setState({
      countriesForQuizRoundRequested: true,
      quiz: {
        type: QUIZ_TYPES[randomQuizTypeKey],
        submissionsRemaining: QUIZ_STARTING_SUBMISSIONS_COUNT,
        countryCodes,
        countryCodesLockedInAsCorrect: [],
        countryCount: QUIZ_STARTING_COUNTRY_COUNT,
        round: 1,
        level: 1,
      },
    });
  }, [state.countriesForQuizRoundRequested, independentOnly, storedCountryData,
        loadCountriesForNewQuizRound]);

  const startNextRound = useCallback(() => {
    if (!state.quiz || state.countriesForQuizRoundRequested) {
      return;
    };

    let newRound = state.quiz.round + 1;
    let newLevel = state.quiz.level;
    let newCountryCount = state.quiz.countryCount + QUIZ_COUNTRY_COUNT_INCREASE;
    let submissionCountIncrease = QUIZ_SUBMISSION_COUNT_INCREASE_PER_ROUND;

    if (newRound > QUIZ_ROUNDS_PER_LEVEL) {
      newLevel = state.quiz.level + 1;
      newRound = 1;
      newCountryCount = QUIZ_STARTING_COUNTRY_COUNT;
      submissionCountIncrease = QUIZ_SUBMISSION_COUNT_INCREASE_PER_LEVEL;
    }

    const randomQuizTypeKey = getRandomNewQuizTypeKey(state.quiz.type.key);
    const countryCodes = getRandomCountryCodes(independentOnly,
        storedCountryData, newCountryCount, newLevel,
        QUIZ_TYPES[randomQuizTypeKey].fieldToRequire);

    loadCountriesForNewQuizRound(countryCodes);

    setState({
      countriesForQuizRoundRequested: true,
      quiz: {
        ...state.quiz,
        type: QUIZ_TYPES[randomQuizTypeKey],
        submissionsRemaining: state.quiz.submissionsRemaining
            + submissionCountIncrease,
        countryCodes,
        countryCodesLockedInAsCorrect: [],
        countryCount: newCountryCount,
        round: newRound,
        level: newLevel,
      },
    });
  }, [state, storedCountryData, independentOnly, loadCountriesForNewQuizRound]);

  // TODO - Could maybe preserve quiz state in local storage,
  // but don't want to encourage cheating...
  return (
    <Page pageTitle={QUIZ_TITLE}>
      <RenderWithLoading
          loaded={storedCountryData.shallowDataLoaded}
          error={error} dataExists={!!Object.keys(storedCountryData.countries).length}>
        <div className="quiz-component component-wrapper">
          <details className="quiz-instructions">
            <summary>
              <h2 id="how-to-play">{QUIZ_INSTRUCTIONS_SUBHEADER}</h2>
            </summary>

            <ol aria-labelledby="how-to-play">
              <li>The topic and structure of the quiz is randomly selected for each round.</li>
              <li>You have a limited number of submission attempts. If you run out (or exit this page), the quiz ends.</li>
              <li>You can submit the full answer for the round in one go or piece by piece through multiple submissions.</li>
              <li>When you make a submission, it will lock in if (and only if) no part of it is incorrect.</li>
              <li>Once the full correct answer has been submitted, you can move on to the next round.</li>
              <li>Remaining submission attempts carry over, with new rounds also granting additional attempts.</li>
              <li>There are {QUIZ_ROUNDS_PER_LEVEL} rounds per level. The number of countries involved increases with each round.</li>
              <li>When you level up, the obscurity of the countries involved increases, and the rounds restart.</li>
              <li>Leave the "{INDEPENDENT_COUNTRIES_CHECKBOX_LABEL}" checkbox at the very top unchecked if you want a greater challenge.</li>
              <li>There are {QUIZ_MAX_LEVEL} levels to beat in total. Keep going for as long as you can!</li>
            </ol>
          </details>

          <RenderWithLoading
              loaded={!state.countriesForQuizRoundRequested || countriesForQuizRoundLoaded}
              focusOnLoad="quiz-type-description"
              error={error}>
            <>
              {/* Quiz Data List */}
              {!!state.quiz && <dl className="quiz-data-list">
                <div className="quiz-data-wrapper">
                  <div>
                    <dt>Level</dt>
                    <dd className="large-number">{state.quiz?.level}</dd>
                  </div>

                  <div>
                    <dt>Round</dt>
                    <dd className="large-number">{state.quiz?.round}/{QUIZ_ROUNDS_PER_LEVEL}</dd>
                  </div>

                  <div className={state.quiz?.submissionsRemaining === 1
                      && state.quiz.countryCodesLockedInAsCorrect.length < state.quiz.countryCodes.length ?
                      "danger" : ""}>
                    <dt>Submissions Remaining</dt>
                    <dd className="large-number">{state.quiz?.submissionsRemaining}</dd>
                  </div>
                </div>

                <div>
                  <dt>Quiz Type</dt>
                  <dd id="quiz-type-description" tabIndex={-1}>
                    {state.quiz?.type.description}{state.quiz?.type.structure === "ranking"
                        && <><br />Only relative order matters for locking in.</>}
                    {/* TODO - ranking quizzes get too hard and not very fun as more countries are added... */}
                  </dd>
                </div>
              </dl>}

              {/* Quiz Controls */}
              {state.quiz && countriesForQuizRoundLoaded
                  && state.quiz.type.structure === "ranking"
                  && <QuizControlsForRanking quiz={state.quiz}
                setQuiz={(quiz) => setState(prev => {
                  return {
                    ...prev,
                    quiz,
                  }
                })} />
              }
              {state.quiz && countriesForQuizRoundLoaded
                  && state.quiz.type.structure === "matching"
                  && <QuizControlsForMatching quiz={state.quiz}
                setQuiz={(quiz) => setState(prev => {
                  return {
                    ...prev,
                    quiz,
                  }
                })} />
              }
            </>
          </RenderWithLoading>

          {/* TODO - make scrolling internal, so that the action button is always shown? */}

          {/* TODO - show more messages, like encouragement for getting everything right in one go */}
          {!quizzingActive && !!state.quiz && <p className="quiz-outcome-message">
            {renderQuizOutcomeMessage(state.quiz)}
          </p>}

          {/* Start New Quiz Button */}
          {!quizzingActive
              && <button type="button" disabled={state.countriesForQuizRoundRequested}
              className="quiz-action-button" onClick={() => startNewQuiz()}>
            {/* Not sure whether to include this */}
            {/* {!!state.quiz && <span aria-hidden="true">✗&nbsp; </span>} */}
            Start New Quiz
          </button>}

          {/* Start Next Round Button */}
          {quizzingActive && nextRoundReadyToStart && <button type="button"
              disabled={state.countriesForQuizRoundRequested && !countriesForQuizRoundLoaded}
              className={`quiz-action-button${(state.quiz?.round ?? 0) < QUIZ_ROUNDS_PER_LEVEL ?
                  "" : " level-up"}`} onClick={() => startNextRound()}>
            <span aria-hidden="true">✓&nbsp; </span>
            {(state.quiz?.round ?? 0) < QUIZ_ROUNDS_PER_LEVEL ? "Start Next Round" : "Level Up!"}
          </button>}
        </div>
      </RenderWithLoading>
    </Page>
  );
}

export default Quiz;
