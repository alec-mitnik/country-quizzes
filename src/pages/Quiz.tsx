import type { Cca3Code } from "@yusifaliyevpro/countries/types";
import confetti from "canvas-confetti";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { StoredCountry } from "../../types/commonTypes";
import Button from "../Button";
import useCountries from "../hooks/useCountries";
import {
  useLocalStorageStateBoolean, useLocalStorageStateNumber,
  useLocalStorageStateObject
} from "../hooks/useLocalStorageState";
import useStateRef from "../hooks/useStateRef";
import {
  COUNTRY_GROUPS,
  QUIZ_BREAKING_VERSION, QUIZ_ROUND_BREAKING_VERSION, QUIZ_TYPES, SORTING_OUT_QUIZ_EXTRA_FIELDS,
  SORTING_OUT_QUIZ_PRIORITY_FIELDS, type CountryQuiz, type MatchingQuiz, type MatchingQuizState,
  type QuizState, type QuizType, type RankingQuizState,
  type SortingOutQuizState
} from "../quizzes/quizConfig";
import QuizControlsForMatching from "../quizzes/QuizControlsForMatching";
import QuizControlsForRanking from "../quizzes/QuizControlsForRanking";
import QuizControlsForSortingOut from "../quizzes/QuizControlsForSortingOut";
import {
  getCountryCodesFilteredForQuizLevel,
  getRandomCountryCodes, getRandomNewQuizType, isQuizActive,
  isQuizBeaten,
  renderQuizOutcomeMessage,
  showConfettiFirework
} from "../quizzes/quizUtils";
import RenderWithLoading from "../RenderWithLoading";
import {
  APP_TITLE,
  APP_URL,
  INDEPENDENT_COUNTRIES_CHECKBOX_LABEL,
  QUIZ_COUNTRY_COUNT_INCREASE,
  QUIZ_INSTRUCTIONS_SUBHEADER,
  QUIZ_MAX_LEVEL,
  QUIZ_ONE_GO_TIP,
  QUIZ_ROUNDS_PER_LEVEL,
  QUIZ_STARTING_COUNTRY_COUNT,
  QUIZ_STARTING_SUBMISSIONS_COUNT,
  QUIZ_SUBMISSION_COUNT_INCREASE_PER_LEVEL,
  QUIZ_SUBMISSION_COUNT_INCREASE_PER_ROUND,
  QUIZ_TITLE
} from "../utils/consts";
import {
  getCountryNameFromCode, getPluralFieldLabel, sortCountryCodesByName
} from "../utils/countryUtils";
import {
  extractRandomArrayElement, formatArrayAsCommaSeparatedString,
  getEmojisForNumber, getRandomArrayElement
} from "../utils/utils";
import Page from "./Page";
import "./Quiz.css";

/**
 * Displays dynamically generated quizzes on randomly selected countries.
 * The way quizzes work, you get limited submission attempts.
 * You can choose how much to submit, and it will either lock in
 * for all correct, or fail for any incorrect.  Only relative order
 * matters for valid submission in ranking quizzes, not absolute order.
 * Quizzes gradually get harder as you progress.
 */
function Quiz() {
  const [quizVersion, setQuizVersion] = useLocalStorageStateNumber("quizVersion", -1);
  const [quizRoundVersion, setQuizRoundVersion] = useLocalStorageStateNumber("quizRoundVersion", -1);
  const [instructionsCollapsed, setInstructionsCollapsed] =
      useLocalStorageStateBoolean("instructionsCollapsed");
  const [quizState, setQuizState] =
      useLocalStorageStateObject<QuizState | null>("quizState", null,
        (key: string, value: unknown) => {
          if (key === "quiz") {
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
            return (value as CountryQuiz).type as QuizType;
          }

          return value;
        },
        (key: string, value: unknown) => {
          if (key === "quiz") {
            return QUIZ_TYPES[value as QuizType];
          }

          return value;
        }
      );

  const [countriesForQuizRoundRequested, setCountriesForQuizRoundRequested] = useState(false);
  const [confettiTimeoutId, setConfettiTimeoutId, confettiTimeoutIdRef] = useStateRef<NodeJS.Timeout | number>(0);
  const confettiLimitTimeoutIdRef = useRef<NodeJS.Timeout | number>(0);

  const { independentOnly, storedCountryData, error, fetchShallowDataForAllCountries,
      fetchCountries } = useCountries();

  const numberOfLockedInCountryCodes = useMemo(() => {
    return quizState ? Object.values(quizState.countryCodesLockedInAsCorrect).flat().length : 0;
  }, [quizState]);

  const quizCountryCodes = (quizState as MatchingQuizState)?.countryCodesOverride ??
      quizState?.countryCodes ?? [];

  // When all countries are correctly locked in, a new round is ready to start
  const nextRoundReadyToStart = !!quizState
      && numberOfLockedInCountryCodes === quizCountryCodes.length;

  const quizActive = isQuizActive(quizState);

  const countriesForQuizRoundLoaded = useMemo(() => {
    if (!quizState) {
      return false;
    }

    return quizState.countryCodes.every(
        cca3 => storedCountryData.countries[cca3]?.fullyLoaded);
  }, [quizState, storedCountryData]);

  useEffect(() => {
    // Update the quiz version.  If it's older than the current breaking version,
    // clear out any pre-existing state.
    if (quizVersion < QUIZ_BREAKING_VERSION) {
      setQuizVersion(QUIZ_BREAKING_VERSION);
      setQuizRoundVersion(QUIZ_ROUND_BREAKING_VERSION);

      if (quizState) {
        setQuizState(null);
      }
    } else if (quizRoundVersion < QUIZ_ROUND_BREAKING_VERSION) {
      // Only the quiz round data is breaking, so just restart the round
      setQuizRoundVersion(QUIZ_ROUND_BREAKING_VERSION);

      if (quizState) {
        const updatedQuizState: QuizState = {
          ...quizState,
          submissionsRemaining: quizState.roundStartSubmissionsRemaining,
          countryCodesLockedInAsCorrect: [],
          incorrectSubmissions: [],
        };

        if (updatedQuizState.quiz.structure === "ranking") {
          (updatedQuizState as RankingQuizState).rankedCountryCodes = [];
        } else if (updatedQuizState.quiz.structure === "matching") {
          (updatedQuizState as MatchingQuizState).matchedCountryCodes = {};
        }

        setQuizState(updatedQuizState);
      }
    }
  }, [quizState, quizVersion, quizRoundVersion, setQuizState,
      setQuizVersion, setQuizRoundVersion]);

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

  const loadCountriesForQuizRound = useCallback((countryCodes: Cca3Code[]) => {
    fetchCountries(countryCodes);
    setCountriesForQuizRoundRequested(true);
  }, [fetchCountries, setCountriesForQuizRoundRequested]);

  useEffect(() => {
    if (quizActive && quizState && !countriesForQuizRoundLoaded
        && !countriesForQuizRoundRequested) {
      // If an in-progress quiz is loaded, have to reload the country data
      loadCountriesForQuizRound(quizState.countryCodes);
    }
  }, [quizActive, quizState, countriesForQuizRoundLoaded,
      countriesForQuizRoundRequested, loadCountriesForQuizRound]);

  useEffect(() => {
    if (!quizActive && quizState && !countriesForQuizRoundLoaded
        && !countriesForQuizRoundRequested) {
      // If an ended quiz is loaded, clear the quiz data
      setQuizState(null);
    }
  }, [quizActive, countriesForQuizRoundLoaded, countriesForQuizRoundRequested,
      quizState, setQuizState]);

  const stopConfettiFireworks = useCallback(() => {
    // Need to use the ref value here, as the state value won't reflect changes
    // since the timeout was initially called
    clearTimeout(confettiTimeoutIdRef.current);
    clearTimeout(confettiLimitTimeoutIdRef.current);

    // Don't reset these or the confetti will immediately restart
    // while still in the quiz beaten state
    // setConfettiTimeoutId(0);
    // confettiLimitTimeoutIdRef.current = 0;
  }, [confettiTimeoutIdRef, confettiLimitTimeoutIdRef]);

  const showConfettiFireworksContinuously = useCallback(() => {
    showConfettiFirework();

    setConfettiTimeoutId(setTimeout(() => {
      showConfettiFireworksContinuously();
    }, Math.floor(Math.random() * 2801) + 200));
  }, [setConfettiTimeoutId]);

  const startConfettiFireworks = useCallback(() => {
    if (!confettiTimeoutId && !confettiLimitTimeoutIdRef.current) {
      showConfettiFireworksContinuously();

      // Stop confetti after 30 seconds
      confettiLimitTimeoutIdRef.current = setTimeout(() => {
        stopConfettiFireworks();
      }, 30000);
    }
  }, [confettiTimeoutId, confettiLimitTimeoutIdRef,
      showConfettiFireworksContinuously, stopConfettiFireworks]);

  useEffect(() => {
    if (!quizActive && quizState && countriesForQuizRoundLoaded && isQuizBeaten(quizState)) {
      // If the quiz has been beaten, start the confetti fireworks,
      // but only after any initial unmount triggers on load
      setTimeout(startConfettiFireworks, 10);
    }
  }, [quizActive, quizState, countriesForQuizRoundLoaded, confettiTimeoutId, startConfettiFireworks]);

  useEffect(() => {
    // Stop and clean up the confetti on unmount
    return () => {
      confetti.reset();
      // eslint-disable-next-line react-hooks/exhaustive-deps
      clearTimeout(confettiTimeoutIdRef.current);
      clearTimeout(confettiLimitTimeoutIdRef.current);
    };
  }, [confettiTimeoutIdRef, confettiLimitTimeoutIdRef]);

  const updateQuizStateForNewRound = useCallback((newQuizState: Partial<QuizState>,
      countryCount = QUIZ_STARTING_COUNTRY_COUNT) => {
    const randomQuizType = getRandomNewQuizType(quizState?.quiz.type);

    if (!randomQuizType) {
      console.error("Unable to get a random quiz type");
      return;
    }

    const availableCountryCodes = getCountryCodesFilteredForQuizLevel(independentOnly,
        storedCountryData, newQuizState.level ?? 1);

    const randomQuiz = QUIZ_TYPES[randomQuizType];
    newQuizState.quiz = randomQuiz;

    if (randomQuiz.structure === "sortingOut") {
      let randomCountryGroup;

      // Always pick a group of size 7 when eligible, since it's only eligible on the last round.
      // 2x2 is easier than 3x1 because it's two 50-50 choices rather than a 33-66 choice and a 50-50 choice.
      // Progression should be:
      // - Round 1 (country count 3): 2 countries, 2 fields
      // - Round 2 (country count 4): 3 countries, 1 field
      // - Round 3 (country count 5): 2 countries, 3 fields
      // - Round 4 (country count 6): 3 countries, 2 fields
      // - Round 5 (country count 7): 7 countries, 1 field

      let fieldCount = 1;

      if (countryCount % 3 === 0) {
        fieldCount = 2;
      } else if (countryCount === 5) {
        fieldCount = 3;
      }

      if (countryCount >= 7) {
        randomCountryGroup = getRandomArrayElement(COUNTRY_GROUPS.filter(group => {
          if (group.countryCodes.length !== 7 || !group.countryCodes.every(cca3 => {
            return !independentOnly || storedCountryData.countries[cca3]?.data?.independent
          })) {
            return false;
          }

          // Require only that at least one of the countries is available obscurity-wise
          return group.countryCodes.some(cca3 =>
            availableCountryCodes.includes(cca3)
          );
        }));
      } else if (countryCount % 2 === 0) {
        randomCountryGroup = getRandomArrayElement(COUNTRY_GROUPS.filter(group => {
          if (group.countryCodes.length !== 3 || !group.countryCodes.every(cca3 => {
            return !independentOnly || storedCountryData.countries[cca3]?.data?.independent
          })) {
            return false;
          }

          // Require only that at least one of the countries is available obscurity-wise
          return group.countryCodes.some(cca3 =>
            availableCountryCodes.includes(cca3)
          );
        }));
      } else if (countryCount % 2 === 1) {
        randomCountryGroup = getRandomArrayElement(COUNTRY_GROUPS.filter(group => {
          // Require only that at least one of the countries is available obscurity-wise
          return group.countryCodes.length === 2 && group.countryCodes.every(cca3 => {
            return !independentOnly || storedCountryData.countries[cca3]?.data?.independent
          }) && group.countryCodes.some(cca3 => availableCountryCodes.includes(cca3));
        }));
      }

      if (!randomCountryGroup) {
        console.warn("Unable to get a random sorting-out quiz country group");

        // Try starting over and selecting a quiz type again
        updateQuizStateForNewRound(newQuizState, countryCount);
        return;
      }

      const newSortingOutQuizState: SortingOutQuizState = newQuizState as SortingOutQuizState;
      newSortingOutQuizState.matchedCountryFields ??= {};
      newSortingOutQuizState.countryFieldsLockedInAsCorrect ??= {};
      newSortingOutQuizState.countryCodes = [...randomCountryGroup.countryCodes];
      sortCountryCodesByName(newSortingOutQuizState.countryCodes, storedCountryData.countries);
      newSortingOutQuizState.countryGroupNameOverride = randomCountryGroup.nameOverride;

      if (fieldCount === SORTING_OUT_QUIZ_PRIORITY_FIELDS.length) {
        newSortingOutQuizState.countryFields = [...SORTING_OUT_QUIZ_PRIORITY_FIELDS];
      } else if (fieldCount < SORTING_OUT_QUIZ_PRIORITY_FIELDS.length) {
        const countryFields: (keyof StoredCountry)[] = [];
        const priorityFields = [...SORTING_OUT_QUIZ_PRIORITY_FIELDS];

        for (let i = 0; i < fieldCount; i++) {
          const field = extractRandomArrayElement(priorityFields);

          if (!field) {
            console.error("Unable to extract a sorting-out quiz priority field");

            // Try starting over and selecting a quiz type again
            updateQuizStateForNewRound(newQuizState, countryCount);
            return;
          }

          countryFields.push(field);
        }

        newSortingOutQuizState.countryFields = countryFields;
      } else {
        newSortingOutQuizState.countryFields = [...SORTING_OUT_QUIZ_PRIORITY_FIELDS,
            ...SORTING_OUT_QUIZ_EXTRA_FIELDS.slice(0,
                fieldCount - SORTING_OUT_QUIZ_PRIORITY_FIELDS.length)];
      }

      // Sort the fields so that unmatched ones get displayed in alphabetical order
      // by field label if there are multiple fields and thus field labels are shown
      newSortingOutQuizState.countryFields.sort((a, b) => {
        return getPluralFieldLabel(a).localeCompare(getPluralFieldLabel(b));
      });

      setQuizState(newSortingOutQuizState as QuizState);

      // Load the new quiz country data
      loadCountriesForQuizRound(newSortingOutQuizState.countryCodes);
      return;
    }

    let countryCodes: Cca3Code[] = [];
    let countryCodeSecondaryIndexes: number[] | undefined = undefined;

    while (countryCodes.length < countryCount) {
      [countryCodes, countryCodeSecondaryIndexes] = getRandomCountryCodes(availableCountryCodes,
          storedCountryData, countryCount, randomQuiz.type,
          randomQuiz.fieldToRequire, (randomQuiz as MatchingQuiz)?.valueArrayFunction,
          randomQuiz.valueFunction);
    }

    newQuizState.countryCodes = countryCodes;

    if (randomQuiz.structure === "matching") {
      const newMatchingQuizState = newQuizState as Partial<MatchingQuizState>;
      newMatchingQuizState.matchedCountryCodes = {};

      if (countryCodeSecondaryIndexes?.length) {
        newMatchingQuizState.countryCodeSecondaryIndexes = countryCodeSecondaryIndexes;
      }

      if (randomQuizType === "MATCH_TO_BORDERING_COUNTRIES") {
        // Combine all bordering countries into a single list
        const borderingCountryCodes: Cca3Code[] = countryCodes.reduce<Cca3Code[]>(
            (acc: Cca3Code[], cca3: Cca3Code) => {
          return [...acc, ...(storedCountryData.countries[cca3]?.data?.borders ?? [])];
        }, []);

        sortCountryCodesByName(borderingCountryCodes, storedCountryData.countries);
        newMatchingQuizState.countryCodesOverride = borderingCountryCodes;
      }

      setQuizState(newMatchingQuizState as QuizState);
    } else if (randomQuiz.structure === "ranking") {
      const newRankingQuizState = newQuizState as Partial<RankingQuizState>;
      newRankingQuizState.rankedCountryCodes = [];

      setQuizState(newRankingQuizState as QuizState);
    }

    // Load the new quiz country data
    loadCountriesForQuizRound(countryCodes);
  }, [quizState?.quiz.type, independentOnly, storedCountryData,
      loadCountriesForQuizRound, setQuizState]);

  const startNewQuiz = useCallback(() => {
    if (countriesForQuizRoundRequested) {
      return;
    };

    stopConfettiFireworks();

    const newQuizState = {
      submissionsRemaining: QUIZ_STARTING_SUBMISSIONS_COUNT,
      roundStartSubmissionsRemaining: QUIZ_STARTING_SUBMISSIONS_COUNT,
      countryCodesLockedInAsCorrect: [],
      round: 1,
      level: 1,
      incorrectSubmissions: [],
    } as Partial<QuizState>;

    updateQuizStateForNewRound(newQuizState);
  }, [countriesForQuizRoundRequested, updateQuizStateForNewRound, stopConfettiFireworks]);

  const startNextRound = useCallback(() => {
    if (!quizState || countriesForQuizRoundRequested) {
      return;
    };

    let countryCount = QUIZ_STARTING_COUNTRY_COUNT
        + quizState.round * QUIZ_COUNTRY_COUNT_INCREASE;
    let newRound = quizState.round + 1;
    let newLevel = quizState.level;
    let submissionCountIncrease = QUIZ_SUBMISSION_COUNT_INCREASE_PER_ROUND;

    if (newRound > QUIZ_ROUNDS_PER_LEVEL) {
      newLevel = quizState.level + 1;
      newRound = 1;
      countryCount = QUIZ_STARTING_COUNTRY_COUNT;
      submissionCountIncrease = QUIZ_SUBMISSION_COUNT_INCREASE_PER_LEVEL;
    }

    const submissionsRemaining =
        quizState.submissionsRemaining + submissionCountIncrease;

    const newQuizState = {
      submissionsRemaining,
      roundStartSubmissionsRemaining: submissionsRemaining,
      countryCodesLockedInAsCorrect: [],
      round: newRound,
      level: newLevel,
      incorrectSubmissions: [],
    } as Partial<QuizState>;

    updateQuizStateForNewRound(newQuizState, countryCount);
  }, [quizState, countriesForQuizRoundRequested, updateQuizStateForNewRound]);

  const quizTypeDescriptionToUse = useMemo(() => {
    let description = quizState?.quiz.description;

    if (quizState?.quiz.structure === "sortingOut") {
      const sortingOutQuizState = quizState as SortingOutQuizState;
      let descriptionFieldLabel: React.ReactNode = <>information</>;

      if (sortingOutQuizState.countryFields.length === 1) {
        descriptionFieldLabel = <strong>{
          getPluralFieldLabel(sortingOutQuizState.countryFields[0], true)
        }</strong>;
      }

      description = <>{description} {descriptionFieldLabel} for special country grouping:</>;
    }

    return description;
  }, [quizState]);

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
              <li><h3>How the Quiz Works</h3></li>
              <ul>
                <li>The topic and structure of the quiz is randomly selected for each round.</li>
                <li>You may be tasked with matching countries to their flags, capitals, locations, etc.</li>
                <li>You may be tasked with ordering countries by size, population, etc.</li>
                <li>The countries involved are also randomly selected for each round.</li>
                <li>Use the "{INDEPENDENT_COUNTRIES_CHECKBOX_LABEL}" checkbox at the very top to affect which countries can be used.</li>
              </ul>
              <li><h3>How to Select Answers</h3></li>
              <ul>
                <li>Countries can be dragged to position, or they can be added/moved/removed using the button controls.</li>
                <li>To drag on a mobile device, tap and hold on a country until it becomes draggable.</li>
                <li>Some devices may not support drag-and-drop well, or at all, so the buttons can be used instead.</li>
                <li>Match values have buttons that can be used to target them directly when adding countries.</li>
              </ul>
              <li><h3>Submission Rules</h3></li>
              <ul>
                <li>You have a limited number of submission attempts. If you run out before completing a round, the quiz ends.</li>
                <li>When you make a submission, it will lock in if (and only if) no part of it is incorrect.</li>
                <li><strong>{QUIZ_ONE_GO_TIP}</strong></li>
                <li>Once the full correct answer has been submitted, you can move on to the next round.</li>
                <li>Remaining submission attempts carry over, with new rounds also granting additional attempts.</li>
              </ul>
              <li><h3>How to Progress</h3></li>
              <ul>
                <li>There are {QUIZ_MAX_LEVEL} levels to beat in total and {QUIZ_ROUNDS_PER_LEVEL} rounds per level.</li>
                <li>The number of countries involved starts small and increases with each round (though it may be depend on the quiz type as well).</li>
                <li>When you level up, a new set of rounds begins, and the obscurity of the countries involved increases.</li>
                <li>Keep going for as long as you can! It's not about winning, but about lasting a little longer each time.</li>
                <li>Progress is automatically saved through the browser's local storage, so feel free to take breaks.</li>
              </ul>
              <li><h3>Other Things to Note</h3></li>
              <ul>
                <li>Feel free to work together with a partner or group!  It can be fun to collaborate that way.</li>
                <li>Mechanics may be updated or new features may be added in the future. <a href="mailto:alecmitnik@gmail.com">Feedback is welcome!</a></li>
                <li><strong>You can toggle displaying these instructions by clicking or tapping "{QUIZ_INSTRUCTIONS_SUBHEADER}."</strong></li>
              </ul>
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
                      && numberOfLockedInCountryCodes < quizCountryCodes.length ?
                      "danger" : ""}>
                    <dt>Submissions Remaining</dt>
                    <dd className="large-number">{quizState?.submissionsRemaining}</dd>
                  </div>
                </div>

                <div>
                  <dt>Quiz Type</dt>
                  <dd id="quiz-type-description" tabIndex={-1}>
                    {/* The dd has a flex display, so wrap in a p for standard text formatting */}
                    <p>
                      {quizTypeDescriptionToUse}{quizState?.quiz.structure === "sortingOut"
                          && <> {
                            (quizState as SortingOutQuizState)?.countryGroupNameOverride
                                ?? formatArrayAsCommaSeparatedString(
                              (quizState as SortingOutQuizState)?.countryCodes.map(cca3 => {
                                return getCountryNameFromCode(cca3, storedCountryData.countries);
                              })
                            )
                          }.</>}
                      {quizState?.quiz.type === "ORDER_BY_POPULATION_DENSITY"
                          && <><br />This refers to total population compared to size (i.e. how crowded it is on average).</>}
                    </p>
                  </dd>
                </div>

                {quizState?.quiz.structure === "ranking" && <div>
                  <dt>Note About Ranking</dt>
                  <dd>
                    Ranked country numbering and locking in only take into account the currently ranked countries.
                    <br /><strong>Remaining unranked countries can still go before or between them!</strong>
                  </dd>
                </div>}

                {quizState?.quiz.structure === "matching" && !quizState.quiz.singleCapacity && <div>
                  <dt>Note About Matching</dt>
                  <dd>
                    For this round, each value can match to zero, one, or multiple draggable countries.
                  </dd>
                </div>}
              </dl>}

              {/* Quiz Controls */}
              {quizState && countriesForQuizRoundLoaded
                  && quizState.quiz.structure === "ranking"
                  && <QuizControlsForRanking quizState={quizState as RankingQuizState}
                setQuizState={setQuizState} />
              }
              {quizState && countriesForQuizRoundLoaded
                  && quizState.quiz.structure === "matching"
                  && <QuizControlsForMatching quizState={quizState as MatchingQuizState}
                setQuizState={setQuizState} />
              }
              {quizState && countriesForQuizRoundLoaded
                  && quizState.quiz.structure === "sortingOut"
                  && <QuizControlsForSortingOut quizState={quizState as SortingOutQuizState}
                setQuizState={setQuizState} />
              }
            </>
          </RenderWithLoading>

          {!quizActive && !!quizState && <>
            <p className="quiz-outcome-message" aria-live="polite">
              {renderQuizOutcomeMessage(quizState)}
            </p>
            {navigator.share != null && quizState.level > Math.floor(QUIZ_MAX_LEVEL * 0.4)
                && <Button type="button" className="quiz-action-button small" onClick={() => {
              const message = isQuizBeaten(quizState) ?
                  `I beat all ${QUIZ_MAX_LEVEL} levels of ${APP_TITLE} with ${quizState.submissionsRemaining
                  } submission${quizState.submissionsRemaining === 1 ? "" : "s"} remaining!
🗺️ 🔹 ${getEmojisForNumber(quizState.submissionsRemaining)} 🔹 🏆
Think you can top that?

${APP_URL}`
                  : `I made it to level ${quizState.level}, round ${
                    quizState.round} in ${APP_TITLE}!
🗺️ 🔹 ${getEmojisForNumber(quizState.level)}▶️${getEmojisForNumber(quizState.round)} 🔹 🧠
How far can you go?

${APP_URL}`;

              void navigator.share({
                text: message,
              });
            }}>
              Share
            </Button>}
          </>}

          {/* Sound effect... */}
          {/* Start Next Round Button */}
          {quizActive && nextRoundReadyToStart && <Button type="button"
              disabled={countriesForQuizRoundRequested && !countriesForQuizRoundLoaded}
              className={`quiz-action-button${(quizState?.round ?? 0) < QUIZ_ROUNDS_PER_LEVEL ?
                  "" : " level-up"}`} onClick={() => startNextRound()}>
            <span className="level-up-background"></span>
            <span className="level-up-content">
              <span aria-hidden="true">✓&nbsp; </span>
              {(quizState?.round ?? 0) < QUIZ_ROUNDS_PER_LEVEL ? "Start Next Round" : "Level Up!"}
            </span>
          </Button>}

          {/* Start New Quiz Button */}
          {!quizActive
              && <Button type="button" disabled={countriesForQuizRoundRequested}
              className="quiz-action-button" onClick={() => startNewQuiz()}>
            Start New Quiz
          </Button>}

          {/* End Quiz Button */}
          {quizActive && !countriesForQuizRoundRequested
              && <Button type="button"
              className="quiz-action-button danger small give-up" onClick={() => {
                if (window.confirm("Are you sure you want to lose your progress?")) {
                  setQuizState(null);
                }
              }}>
            End Quiz
          </Button>}
        </div>
      </RenderWithLoading>
    </Page>
  );
}

export default Quiz;
