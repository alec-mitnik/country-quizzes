import type { Cca3Code } from "@yusifaliyevpro/countries/types";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { CountryStorage, StoredCountry, StoredCountryWrapper } from "../CountriesProvider";
import useCountries from "../hooks/useCountries";
import QuizControlsForMatching from "../quizzes/QuizControlsForMatching";
import QuizControlsForRanking from "../quizzes/QuizControlsForRanking";
import RenderWithLoading from "../RenderWithLoading";
import {
  NO_COUNTRIES_LOADED_MESSAGE, QUIZ_COUNTRY_COUNT_INCREASE,
  QUIZ_INSTRUCTIONS_SUBHEADER, QUIZ_STARTING_COUNTRY_COUNT,
  QUIZ_STARTING_SUBMISSIONS_COUNT, QUIZ_SUBMISSION_COUNT_INCREASE, QUIZ_TITLE
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
type QuizTypeKey = "MATCH_TO_CURRENCIES" | "MATCH_TO_CAPITALS" | "MATCH_TO_FLAGS"
    | "ORDER_BY_SIZE" | "ORDER_BY_POPULATION";

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
    fieldToRequire: "flagDescription",
    valueFunction: (storedCountryData: CountryStorage, cca3: Cca3Code) =>
        storedCountryData.countries[cca3]?.data?.flagDescription ?? "Unknown",
    labelFunction: (storedCountryData: CountryStorage, cca3: Cca3Code) =>
        storedCountryData.countries[cca3]?.data?.flagDescription ?? "Unknown",
  },
  ORDER_BY_SIZE: {
    key: "ORDER_BY_SIZE",
    description: "Order the countries by size, largest first.",
    structure: "ranking",
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
    description: "Order the countries by population, largest first.",
    structure: "ranking",
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
};

function getRandomNewQuizTypeKey(currentTypeKey?: QuizTypeKey) {
  const quizTypeKeys = Object.keys(QUIZ_TYPES) as QuizTypeKey[];
  const quizTypes = quizTypeKeys.length < 2 ? quizTypeKeys
      : quizTypeKeys.filter(key => key !== currentTypeKey);
  const randomTypeKey = getRandomArrayElement<QuizTypeKey>(quizTypes);
  return randomTypeKey;
}

// Note that fieldToRequire must be part of the shallow data expected to already be loaded
function getRandomCountryCodes(independentOnly: boolean, storedCountries: Partial<Record<Cca3Code,
  StoredCountryWrapper>>, count: number, fieldToRequire?: keyof StoredCountry) {
  let countryCodes = Object.keys(storedCountries);

  if (independentOnly) {
    countryCodes = countryCodes.filter(cca3 => storedCountries[cca3]?.data?.independent);
  }

  if (fieldToRequire) {
    countryCodes = countryCodes.filter(cca3 => storedCountries[cca3]?.data?.[fieldToRequire]);
  }

  const selectedCountryCodes: string[] = [];

  while (countryCodes.length && count > 0) {
    selectedCountryCodes.push(extractRandomArrayElement<string>(countryCodes));
    count--;
  }

  return selectedCountryCodes;
}

function renderQuizOutcomeMessage(quiz: Quiz) {
  if (quiz.round >= 11) {
    // Cleared 10 rounds
    return "Amazing! You really know your stuff!";
  } else if (quiz.round >= 8) {
    // Cleared 7 rounds
    return "Well done! You lasted a while.";
  } else if (quiz.round >= 5) {
    // Cleared 4 rounds
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
 * Could track correct/incorrect submissions per country in local storage,
 * and show stats on how well you know each country.
 */

/**
 * Displays dynamically generated quizzes on randomly selected countries.
 * The way quizzes work, you get limited submission attempts.
 * You can choose how much to submit, and it will either lock in
 * for all correct, or fail for any incorrect.  Only relative order
 * matters for valid submission in ranking quizzes, not absolute order.
 * Quizzes gradually get harder by involving more countries.
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

  const quizzingActive = state.quiz && (nextRoundReadyToStart || state.quiz.submissionsRemaining > 0);

  // When there are no more submissions remaining, the quiz is over
  // const quizzingEnded = !newRoundReadyToStart && state.quiz?.submissionsRemaining === 0;

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
        storedCountryData.countries, QUIZ_STARTING_COUNTRY_COUNT,
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
      },
    });
  }, [state.countriesForQuizRoundRequested, independentOnly, storedCountryData,
        loadCountriesForNewQuizRound]);

  const startNextRound = useCallback(() => {
    if (!state.quiz || state.countriesForQuizRoundRequested) {
      return;
    };

    const randomQuizTypeKey = getRandomNewQuizTypeKey(state.quiz.type.key);
    const newCountryCount = state.quiz.countryCount + QUIZ_COUNTRY_COUNT_INCREASE;
    const countryCodes = getRandomCountryCodes(independentOnly,
        storedCountryData.countries, newCountryCount,
        QUIZ_TYPES[randomQuizTypeKey].fieldToRequire);

    loadCountriesForNewQuizRound(countryCodes);

    setState({
      countriesForQuizRoundRequested: true,
      quiz: {
        ...state.quiz,
        type: QUIZ_TYPES[randomQuizTypeKey],
        submissionsRemaining: state.quiz.submissionsRemaining
            + QUIZ_SUBMISSION_COUNT_INCREASE,
        countryCodes,
        countryCodesLockedInAsCorrect: [],
        countryCount: newCountryCount,
        round: state.quiz.round + 1,
      },
    });
  }, [state, storedCountryData, independentOnly, loadCountriesForNewQuizRound]);

  // TODO - Could maybe preserve quiz state in local storage,
  // but don't want to encourage cheating...
  return (
    <Page pageTitle={QUIZ_TITLE}>
      <RenderWithLoading
          loaded={storedCountryData.shallowDataLoaded}
          error={error} dataExists={!!Object.keys(storedCountryData.countries).length}
          noDataMessage={NO_COUNTRIES_LOADED_MESSAGE}>
        <div className="quiz-component component-wrapper">
          <details className="quiz-instructions">
            <summary>
              <h2 id="how-to-play">{QUIZ_INSTRUCTIONS_SUBHEADER}</h2>
            </summary>

            <ol aria-labelledby="how-to-play">
              <li>You can submit the full answer in one go or piece by piece through multiple submissions.</li>
              <li>When you make a submission, it will lock in if and only if no part of it is incorrect.</li>
              <li>You have a limited number of submission attempts. If you run out (or exit this page), the quiz ends.</li>
              <li>Once the full correct answer has been submitted, you can move on to the next round.</li>
              <li>There are various quiz types, with a new one being randomly selected for each round.</li>
              <li>When a quiz involves ranking countries in order, only relative order matters for locking in.</li>
              <li>Remaining submission attempts carry over, with new rounds also granting additional attempts.</li>
              <li>The number of countries involved increases with each round. Keep going for as long as you can!</li>
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
                    <dt>Round</dt>
                    <dd className="large-number">#{state.quiz?.round}</dd>
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
                  <dd id="quiz-type-description" tabIndex={-1}>{state.quiz?.type.description}</dd>
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
              className="quiz-action-button" onClick={() => startNextRound()}>
            <span aria-hidden="true">✓&nbsp; </span>
            Start Next Round
          </button>}
        </div>
      </RenderWithLoading>
    </Page>
  );
}

export default Quiz;
