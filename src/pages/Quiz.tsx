import type { Cca3Code } from "@yusifaliyevpro/countries/types";
import { useCallback, useEffect, useState } from "react";
import { NO_COUNTRIES_LOADED_MESSAGE, QUIZ_COUNTRY_COUNT_INCREASE, QUIZ_INSTRUCTIONS_SUBHEADER, QUIZ_STARTING_COUNTRY_COUNT, QUIZ_STARTING_SUBMISSIONS_COUNT, QUIZ_SUBMISSION_COUNT_INCREASE, QUIZ_TITLE } from "../consts";
import type { StoredCountry } from "../CountriesProvider";
import useCountries from "../hooks/useCountries";
import useInitialized from "../hooks/useInitialized";
import RenderWithLoading from "../RenderWithLoading";
import Page from "./Page";

type QuizStructure = "matching" | "ranking";

interface QuizType {
  description: string;
  structure: QuizStructure;
};

// More types can be added in the future
const QUIZ_TYPES: Record<string, QuizType> = {
  MATCH_NAMES_TO_FLAGS: {
    description: "Match the countries to their flags.",
    structure: "matching",
  },
  MATCH_NAMES_TO_CAPITALS: {
    description: "Match the countries to their capitals.",
    structure: "matching",
  },
  ORDER_BY_SIZE: {
    description: "Order the countries by size, largest first.",
    structure: "ranking",
  },
  ORDER_BY_POPULATION: {
    description: "Order the countries by population, largest first.",
    structure: "ranking",
  },
};

function getRandomArrayElement<T>(array: T[]) {
  return array[Math.floor(Math.random() * array.length)];
}

function extractRandomArrayElement<T>(array: T[]) {
  const randomIndex = Math.floor(Math.random() * array.length);
  return array.splice(randomIndex, 1)[0];
}

function getRandomQuizTypeKey() {
  const quizTypes = Object.keys(QUIZ_TYPES);
  const randomTypeKey = getRandomArrayElement<string>(quizTypes);
  return randomTypeKey;
}

function getRandomCountryCodes(storedCountries: Record<string, Partial<StoredCountry>>, count: number) {
  const countryNames = Object.keys(storedCountries);
  const selectedCountryNames: string[] = [];

  while (countryNames.length && count > 0) {
    selectedCountryNames.push(extractRandomArrayElement<string>(countryNames));
    count--;
  }

  return selectedCountryNames;
}

interface Quiz {
  type: QuizType;
  submissionsRemaining: number;
  countryCodes: Cca3Code[];
  countryCodesLockedInAsCorrect: Cca3Code[];
  countryCount: number;
  round: number;
};

/**
 * Displays dynamically generated quizzes on randomly selected countries.
 *
 * The way quizzes work, you get limited submission attempts.
 * You can choose how much to submit, and it will either lock in
 * for all correct, or fail for any incorrect.  Only relative order
 * matters for valid submission in ranking quizzes, not absolute order.
 * Quizzes gradually get harder by involving more countries.
 *
 * Could perhaps make difficulty adjust by using less well-known countries
 * (referring to a ranking by tourism or something).
 * Maybe more roguelike elements could be introduced, like items and bonuses that
 * reveal more values of the countries involved (languages, currencies, continent, etc.).
 */
function Quiz() {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [quizzingReadyToStart, setQuizzingReadyToStart] = useState(false);
  const [quizRoundStarted, setQuizRoundStarted] = useState(false);

  const { storedCountries, error, loading, fetchCountryNamesAndCodes, fetchCountries } = useCountries();
  const countryNamesAndCodesLoaded = useInitialized(loading, fetchCountryNamesAndCodes);

  // When all countries are correctly locked in, a new round is ready to start
  const newRoundReadyToStart = !!quiz
      && quiz.countryCodesLockedInAsCorrect.length === quiz.countryCodes.length;

  // When there are no more submissions remaining, the quiz is over
  const quizzingEnded = !newRoundReadyToStart && quiz?.submissionsRemaining === 0;

  const loadCountriesForNewQuizRound = useCallback((countryCodes: Cca3Code[]) => {
    if (fetchCountries(countryCodes)) {
      // Countries already loaded
      return true;
    } else {
      // Need to wait for country data to be fetched
      setQuizRoundStarted(false);
      return false;
    }
  }, [fetchCountries, setQuizRoundStarted]);

  const startNewQuiz = useCallback(() => {
    const randomQuizTypeKey = getRandomQuizTypeKey();
    const countryCodes = getRandomCountryCodes(storedCountries, QUIZ_STARTING_COUNTRY_COUNT);

    setQuiz({
      type: QUIZ_TYPES[randomQuizTypeKey],
      submissionsRemaining: QUIZ_STARTING_SUBMISSIONS_COUNT,
      countryCodes,
      countryCodesLockedInAsCorrect: [],
      countryCount: QUIZ_STARTING_COUNTRY_COUNT,
      round: 1,
    });

    loadCountriesForNewQuizRound(countryCodes);
  }, [storedCountries, loadCountriesForNewQuizRound, setQuiz]);

  const startNewRound = useCallback(() => {
    if (!quiz) {
      return
    };

    const randomQuizTypeKey = getRandomQuizTypeKey();
    const newCountryCount = quiz.countryCount + QUIZ_COUNTRY_COUNT_INCREASE;
    const countryCodes = getRandomCountryCodes(storedCountries, newCountryCount);

    setQuiz({
      ...quiz,
      type: QUIZ_TYPES[randomQuizTypeKey],
      submissionsRemaining: quiz.submissionsRemaining + QUIZ_SUBMISSION_COUNT_INCREASE,
      countryCodes,
      countryCodesLockedInAsCorrect: [],
      countryCount: newCountryCount,
      round: quiz.round++,
    });

    loadCountriesForNewQuizRound(countryCodes);
  }, [quiz, storedCountries, loadCountriesForNewQuizRound, setQuiz]);

  function attemptSubmit() {
    // TODO
  }

  useEffect(() => {
    if (countryNamesAndCodesLoaded && !quizzingReadyToStart) {
      // Country names and codes loaded, ready to start quizzing
      setQuizzingReadyToStart(true);
      startNewQuiz();
    }
  }, [countryNamesAndCodesLoaded, quizzingReadyToStart, setQuizzingReadyToStart, startNewQuiz]);

  useEffect(() => {
    if (!loading && !quizRoundStarted && quizzingReadyToStart) {
      // Countries loaded for the quiz round, ready to start the round
      setQuizRoundStarted(true);
    }
  }, [loading, quizRoundStarted, quizzingReadyToStart, quizzingEnded, setQuizRoundStarted]);

  // TODO - get dataExists to properly reflect quiz round loading as well
  return (
    <Page pageTitle={QUIZ_TITLE}>
      <RenderWithLoading
          loaded={quizRoundStarted || (!!error && countryNamesAndCodesLoaded)}
          error={error} dataExists={!!quiz?.countryCodes.length} noDataMessage={NO_COUNTRIES_LOADED_MESSAGE}>
        <>
          <details className="quiz-instructions">
            <summary>
              <h2 id="how-to-play">{QUIZ_INSTRUCTIONS_SUBHEADER}</h2>
            </summary>

            <ol aria-labelledby="how-to-play">
              <li>You can submit the full answer in one go, or through multiple smaller submissions.</li>
              <li>When you submit your guess, it will lock in if and only if no part of it is incorrect.</li>
              <li>You have a limited number of submission attempts.  If you run out, the quiz ends.</li>
              <li>Once the full correct answer has been submitted, a new round begins.</li>
              <li>The quiz type is randomly selected for each round.</li>
              <li>Remaining submission attempts carry over, with new rounds granting additional attempts.</li>
              <li>New rounds increase the number of countries involved.  Keep going for as long as you can!</li>
            </ol>
          </details>

          <dl className="quiz-data-list">
            <div>
              <dt>Round:</dt>
              <dd>{quiz?.round}</dd>
            </div>

            <div>
              <dt>Submissions Remaining:</dt>
              <dd>{quiz?.submissionsRemaining}</dd>
            </div>

            <div>
              <dt>Quiz Type:</dt>
              <dd>{quiz?.type.description}</dd>
            </div>

            <div>
              <dt>Countries:</dt>
              <dd>{quiz?.countryCodes.map(countryCode => storedCountries[countryCode].name).join(", ")}</dd>
            </div>

            {/* {quiz?.type.structure === "ranking" && (

            )}
            {quiz?.type.structure === "matching" && (

            )} */}
          </dl>

          {/* TODO */}
          <p>Actual quiz mechanics coming soon...</p>

          {newRoundReadyToStart && <button type="button" onClick={startNewRound}>
            Start New Round
          </button>}

          {quizzingEnded && <button type="button" onClick={startNewQuiz}>
            Start New Quiz
          </button>}

          {/* Disable if no new guesses have been made - TODO */}
          {!newRoundReadyToStart && !quizzingEnded
              && <button type="button" disabled={true} onClick={attemptSubmit}>
            Submit
          </button>}
        </>
      </RenderWithLoading>
    </Page>
  );
}

export default Quiz;
