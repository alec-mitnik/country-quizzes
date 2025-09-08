import type { Cca3Code } from "@yusifaliyevpro/countries/types";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { CountryStorage, StoredCountry } from "../CountriesProvider";
import useCountries from "../hooks/useCountries";
import { useLocalStorageStateBoolean } from "../hooks/useLocalStorageState";
import { QUIZ_TYPES, type QuizState, type QuizType } from "../quizzes/quizConfig";
import QuizControlsForMatching from "../quizzes/QuizControlsForMatching";
import QuizControlsForRanking from "../quizzes/QuizControlsForRanking";
import RenderWithLoading from "../RenderWithLoading";
import {
  INDEPENDENT_COUNTRIES_CHECKBOX_LABEL,
  QUIZ_COUNTRY_COUNT_INCREASE,
  QUIZ_INSTRUCTIONS_SUBHEADER, QUIZ_MAX_LEVEL, QUIZ_ROUNDS_PER_LEVEL, QUIZ_STARTING_COUNTRY_COUNT,
  QUIZ_STARTING_SUBMISSIONS_COUNT, QUIZ_SUBMISSION_COUNT_INCREASE_PER_LEVEL,
  QUIZ_SUBMISSION_COUNT_INCREASE_PER_ROUND, QUIZ_TITLE
} from "../utils/consts";
import { extractRandomArrayElement, getRandomArrayElement } from "../utils/utils";
import Page from "./Page";
import "./Quiz.css";

function getRandomNewQuizType(currentType?: QuizType) {
  const quizTypes = Object.keys(QUIZ_TYPES) as QuizType[];
  const quizzes = quizTypes.length < 2 ? quizTypes
      : quizTypes.filter(key => key !== currentType);
  const randomType = getRandomArrayElement<QuizType>(quizzes);
  return randomType;
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

function renderQuizOutcomeMessage(quiz: QuizState) {
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

/**
 * Displays dynamically generated quizzes on randomly selected countries.
 * The way quizzes work, you get limited submission attempts.
 * You can choose how much to submit, and it will either lock in
 * for all correct, or fail for any incorrect.  Only relative order
 * matters for valid submission in ranking quizzes, not absolute order.
 * Quizzes gradually get harder as you progress.
 */
function Quiz() {
  const [instructionsCollapsed, setInstructionsCollapsed] =
      useLocalStorageStateBoolean("instructionsCollapsed");
  const [quizState, setQuizState] = useState<QuizState | null>(null);
  const [countriesForQuizRoundRequested, setCountriesForQuizRoundRequested] = useState(false);

  const { independentOnly, storedCountryData, error, fetchShallowDataForAllCountries,
      fetchCountries } = useCountries();

  // When all countries are correctly locked in, a new round is ready to start
  const nextRoundReadyToStart = !!quizState
      && quizState.countryCodesLockedInAsCorrect.length === quizState.countryCodes.length;

  const quizzingActive = quizState
      && (quizState.level < QUIZ_MAX_LEVEL
          || quizState.round < QUIZ_ROUNDS_PER_LEVEL
          || quizState.countryCodesLockedInAsCorrect.length < quizState.countryCodes.length)
      && (nextRoundReadyToStart || quizState.submissionsRemaining > 0);

  const countriesForQuizRoundLoaded = useMemo(() => {
    if (!quizState) {
      return false;
    }

    return quizState.countryCodes.every(
        cca3 => storedCountryData.countries[cca3]?.fullyLoaded);
  }, [quizState, storedCountryData]);

  useEffect(() => {
    if (!error && !storedCountryData.shallowDataRequested) {
      // Make sure the shallow data is loaded from the get go
      fetchShallowDataForAllCountries();
    }
  }, [error, storedCountryData, fetchShallowDataForAllCountries]);

  useEffect(() => {
    if (countriesForQuizRoundLoaded && countriesForQuizRoundRequested) {
      // Once countries for the quiz round are loaded, reset the requested flag
      setCountriesForQuizRoundRequested(false);
    }
  }, [countriesForQuizRoundLoaded, countriesForQuizRoundRequested,
      setCountriesForQuizRoundRequested]);

  const loadCountriesForNewQuizRound = useCallback((countryCodes: Cca3Code[]) => {
    fetchCountries(countryCodes);
    setCountriesForQuizRoundRequested(true);
  }, [fetchCountries, setCountriesForQuizRoundRequested]);

  const startNewQuiz = useCallback(() => {
    if (countriesForQuizRoundRequested) {
      return;
    };

    const randomQuizTypeKey = getRandomNewQuizType();
    const countryCodes = getRandomCountryCodes(independentOnly,
        storedCountryData, QUIZ_STARTING_COUNTRY_COUNT, 1,
        QUIZ_TYPES[randomQuizTypeKey].fieldToRequire);

    loadCountriesForNewQuizRound(countryCodes);

    setQuizState({
      quiz: QUIZ_TYPES[randomQuizTypeKey],
      submissionsRemaining: QUIZ_STARTING_SUBMISSIONS_COUNT,
      countryCodes,
      countryCodesLockedInAsCorrect: [],
      countryCount: QUIZ_STARTING_COUNTRY_COUNT,
      round: 1,
      level: 1,
      incorrectSubmissions: [],
    });
  }, [countriesForQuizRoundRequested, independentOnly, storedCountryData,
      setQuizState, loadCountriesForNewQuizRound]);

  const startNextRound = useCallback(() => {
    if (!quizState || countriesForQuizRoundRequested) {
      return;
    };

    let newRound = quizState.round + 1;
    let newLevel = quizState.level;
    let newCountryCount = quizState.countryCount + QUIZ_COUNTRY_COUNT_INCREASE;
    let submissionCountIncrease = QUIZ_SUBMISSION_COUNT_INCREASE_PER_ROUND;

    if (newRound > QUIZ_ROUNDS_PER_LEVEL) {
      newLevel = quizState.level + 1;
      newRound = 1;
      newCountryCount = QUIZ_STARTING_COUNTRY_COUNT;
      submissionCountIncrease = QUIZ_SUBMISSION_COUNT_INCREASE_PER_LEVEL;
    }

    const randomQuizTypeKey = getRandomNewQuizType(quizState.quiz.type);
    const countryCodes = getRandomCountryCodes(independentOnly,
        storedCountryData, newCountryCount, newLevel,
        QUIZ_TYPES[randomQuizTypeKey].fieldToRequire);

    loadCountriesForNewQuizRound(countryCodes);

    setQuizState({
      quiz: QUIZ_TYPES[randomQuizTypeKey],
      submissionsRemaining: quizState.submissionsRemaining
          + submissionCountIncrease,
      countryCodes,
      countryCodesLockedInAsCorrect: [],
      countryCount: newCountryCount,
      round: newRound,
      level: newLevel,
      incorrectSubmissions: [],
    });
  }, [countriesForQuizRoundRequested, storedCountryData, independentOnly,
      quizState, setQuizState, loadCountriesForNewQuizRound]);

  // TODO - Could maybe preserve quiz state in local storage,
  // but don't want to encourage cheating...
  return (
    <Page pageTitle={QUIZ_TITLE}>
      <RenderWithLoading
          loaded={storedCountryData.shallowDataLoaded}
          error={error} dataExists={!!Object.keys(storedCountryData.countries).length}>
        <div className="quiz-component component-wrapper">
          <details className="quiz-instructions" open={!instructionsCollapsed}
              onToggle={event => setInstructionsCollapsed(!event.currentTarget.open)}>
            <summary>
              <h2 id="how-to-play">{QUIZ_INSTRUCTIONS_SUBHEADER}</h2>
            </summary>

            <ol aria-labelledby="how-to-play">
              <li>The topic and structure of the quiz is randomly selected for each round.</li>
              <ul>
                <li>You may be tasked with matching countries to their flags, capitals, locations, etc.</li>
                <li>You may be tasked with ordering countries by size, population, etc.</li>
              </ul>
              <li>Countries can be dragged to position, or they can be added/moved/removed using the buttons.</li>
              <ul>
                <li>To drag on a mobile device, tap and hold on a country until it becomes draggable.</li>
                <li>Some devices may not support drag-and-drop well, or at all, so the buttons can be used instead.</li>
              </ul>
              <li>You have a limited number of submission attempts. If you run out (or exit this page), the quiz ends.</li>
              <ul>
                <li>When you make a submission, it will lock in if (and only if) no part of it is incorrect.</li>
                <li><strong>You needn't submit the full answer for the round in one go! It may be better to lock it in piece by piece.</strong></li>
                <li>Once the full correct answer has been submitted, you can move on to the next round.</li>
                <li>Remaining submission attempts carry over, with new rounds also granting additional attempts.</li>
              </ul>
              <li>There are {QUIZ_MAX_LEVEL} levels to beat in total and {QUIZ_ROUNDS_PER_LEVEL} rounds per level.</li>
              <ul>
                <li>The number of countries involved starts small and increases with each round.</li>
                <li>When you level up, a new set of rounds begins, and the obscurity of the countries involved increases.</li>
                <li>Keep going for as long as you can! It's not about winning, but about lasting a little longer each time.</li>
                <li>Leave the "{INDEPENDENT_COUNTRIES_CHECKBOX_LABEL}" checkbox at the very top unchecked if you want a greater challenge.</li>
              </ul>
              <li>You can toggle displaying these instructions by clicking or tapping "{QUIZ_INSTRUCTIONS_SUBHEADER}."</li>
            </ol>
          </details>

          <RenderWithLoading
              loaded={!countriesForQuizRoundRequested || countriesForQuizRoundLoaded}
              focusOnLoad="quiz-type-description"
              error={error}>
            <>
              {/* Quiz Data List */}
              {!!quizState && <dl className="quiz-data-list">
                <div className="quiz-data-wrapper">
                  <div>
                    <dt>Level</dt>
                    <dd className="large-number">{quizState?.level}</dd>
                  </div>

                  <div>
                    <dt>Round</dt>
                    <dd className="large-number">{quizState?.round}/{QUIZ_ROUNDS_PER_LEVEL}</dd>
                  </div>

                  <div className={quizState?.submissionsRemaining === 1
                      && quizState.countryCodesLockedInAsCorrect.length < quizState.countryCodes.length ?
                      "danger" : ""}>
                    <dt>Submissions Remaining</dt>
                    <dd className="large-number">{quizState?.submissionsRemaining}</dd>
                  </div>
                </div>

                <div>
                  <dt>Quiz Type</dt>
                  <dd id="quiz-type-description" tabIndex={-1}>
                    {quizState?.quiz.description}{quizState?.quiz.structure === "ranking"
                        && <><br />Only relative order matters for locking in.</>}
                    {/* TODO - ranking quizzes get too hard and not very fun as more countries are added... */}
                  </dd>
                </div>
              </dl>}

              {/* Quiz Controls */}
              {quizState && countriesForQuizRoundLoaded
                  && quizState.quiz.structure === "ranking"
                  && <QuizControlsForRanking quizState={quizState}
                setQuizState={setQuizState} />
              }
              {quizState && countriesForQuizRoundLoaded
                  && quizState.quiz.structure === "matching"
                  && <QuizControlsForMatching quizState={quizState}
                setQuizState={setQuizState} />
              }
            </>
          </RenderWithLoading>

          {/* TODO - make scrolling internal, so that the action button is always shown? */}

          {/* TODO - show more messages, like encouragement for getting everything right in one go */}
          {!quizzingActive && !!quizState && <p className="quiz-outcome-message">
            {renderQuizOutcomeMessage(quizState)}
          </p>}

          {/* Start New Quiz Button */}
          {!quizzingActive
              && <button type="button" disabled={countriesForQuizRoundRequested}
              className="quiz-action-button" onClick={() => startNewQuiz()}>
            {/* Not sure whether to include this */}
            {/* {!!state.quiz && <span aria-hidden="true">✗&nbsp; </span>} */}
            Start New Quiz
          </button>}

          {/* Start Next Round Button */}
          {quizzingActive && nextRoundReadyToStart && <button type="button"
              disabled={countriesForQuizRoundRequested && !countriesForQuizRoundLoaded}
              className={`quiz-action-button${(quizState?.round ?? 0) < QUIZ_ROUNDS_PER_LEVEL ?
                  "" : " level-up"}`} onClick={() => startNextRound()}>
            <span aria-hidden="true">✓&nbsp; </span>
            {(quizState?.round ?? 0) < QUIZ_ROUNDS_PER_LEVEL ? "Start Next Round" : "Level Up!"}
          </button>}
        </div>
      </RenderWithLoading>
    </Page>
  );
}

export default Quiz;
