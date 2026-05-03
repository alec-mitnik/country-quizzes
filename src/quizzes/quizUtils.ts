import type { Cca3Code } from "@yusifaliyevpro/countries/types";
import confetti from "canvas-confetti";
import type { StoredCountry } from "../../types/commonTypes";
import type { CountryStorage } from "../CountriesProvider";
import {
  QUIZ_MAX_DUPLICATE_MATCH_VALUES, QUIZ_MAX_LEVEL,
  QUIZ_ROUNDS_PER_LEVEL
} from "../utils/consts";
import {
  extractRandomArrayElement, getRandomArrayElement, getRandomHue,
  hslToHex, removeElementFromArray
} from "../utils/utils";
import {
  QUIZ_TYPES, type CountryCodeOverrideData, type MatchingQuizState,
  type QuizState, type QuizType
} from "./quizConfig";

/**
 * Selects a new random quiz type
 * @param currentType Current quiz type, if any, to not repeat
 * @returns A random new quiz type
 */
export function getRandomNewQuizType(currentType?: QuizType): QuizType | undefined {
  // return "MATCH_TO_FUN_FACTS"; // For easy testing
  const quizConfigs = Object.values(QUIZ_TYPES);
  const quizTypes: QuizType[] = [];

  for (const quizConfig of quizConfigs) {
    // Default frequency is 3
    for (let i = 0; i < (quizConfig.frequency ?? 3); i++) {
      quizTypes.push(quizConfig.type);
    }
  }

  const quizzes = quizConfigs.length < 2 ? quizTypes
      : quizTypes.filter(quizType => quizType !== currentType);
  const randomType = getRandomArrayElement<QuizType>(quizzes);
  return randomType;
}

/**
 * Constructs the country codes override data for bordering country quizzes
 * @param storedCountryData The country data
 * @param countryCodes The originating country codes
 * @returns The CountryCodeOverrideData[] of bordering country code data
 */
export function constructBorderingCountryCodesOverride(storedCountryData: CountryStorage, countryCodes: Cca3Code[]) {
  // Combine all bordering countries into a single sorted array
  // that keeps reference to the original countries for rendering tracking
  const borderingCountryCodes: CountryCodeOverrideData[] =
      countryCodes.flatMap(cca3 => (storedCountryData.countries[cca3]?.data?.borders ?? [])
          .map(borderingCca3 => (
            {
              originatingCca3: cca3,
              cca3: borderingCca3,
              secondaryIndex: 0,
            }
          )) as CountryCodeOverrideData[]);
  return borderingCountryCodes;
}

/**
 * Function for checking if two CountryCodeOverrideData objects represent the same data
 * @param a The first CountryCodeOverrideData to compare
 * @param b The second CountryCodeOverrideData to compare
 * @returns Whether the two CountryCodeOverrideData objects match
 */
export function doCountryCodeOverridesMatch(a: CountryCodeOverrideData | null,
    b: CountryCodeOverrideData | null) {
  return !!(a && b && a.cca3 === b.cca3 && a.originatingCca3 === b.originatingCca3
      && a.secondaryIndex === b.secondaryIndex);
}

/**
 * Determines if the quiz is currently active (not completed or failed)
 * @param quizState The quiz state data
 * @returns Whether the quiz is currently active
 */
export function isQuizActive(quizState: QuizState | null) {
  if (!quizState) {
    return false;
  }

  const numberOfLockedInCountryCodes =
      Object.values(quizState.countryCodesLockedInAsCorrect).flat().length
  const quizCountryCodes = (quizState as MatchingQuizState)?.countryCodesOverride ??
      quizState.countryCodes;
  const nextRoundReadyToStart = numberOfLockedInCountryCodes === quizCountryCodes.length;

  return (quizState.level < QUIZ_MAX_LEVEL
          || quizState.round < QUIZ_ROUNDS_PER_LEVEL
          || numberOfLockedInCountryCodes < quizCountryCodes.length)
      && (nextRoundReadyToStart || quizState.submissionsRemaining > 0);
}

/**
 * Function to check if the quiz has been beaten
 * @param quizState The state of the quiz
 * @returns Whether the quiz has been beaten
 */
export function isQuizBeaten(quizState: QuizState) {
  const quizCountryCodes = (quizState as MatchingQuizState)?.countryCodesOverride ??
        quizState?.countryCodes ?? [];

  return quizState.level >= QUIZ_MAX_LEVEL && quizState.round >= QUIZ_ROUNDS_PER_LEVEL
      && Object.values(quizState.countryCodesLockedInAsCorrect).flat().length >= quizCountryCodes.length;
}

/**
 * Determines the message to show when a quiz ends
 * @param quizState Quiz state data
 * @returns String message for the outcome of the quiz
 */
export function renderQuizOutcomeMessage(quizState: QuizState) {
  if (isQuizBeaten(quizState)) {
    // Cleared all 10 levels
    return "You beat the quiz! You're a country whiz.";
  } else if (quizState.level > Math.floor(QUIZ_MAX_LEVEL * 0.8)) {
    // Cleared 8 levels
    return "Amazing! You really know your stuff.";
  }else if (quizState.level > Math.floor(QUIZ_MAX_LEVEL * 0.6)) {
    // Cleared 6 levels
    return "Well done! You lasted a while.";
  } else if (quizState.level > Math.floor(QUIZ_MAX_LEVEL * 0.4)) {
    // Cleared 4 levels
    return "Not bad. Go again?";
  } else {
    // Default
    return "Better luck next time.";
  }
}

/**
 * Shows a random burst of confetti resembling a firework
 */
export function showConfettiFirework() {
  const origin = {
    // Keep to central region
    x: Math.random() * 0.8 + 0.1,
    // Keep to the upper section
    y: Math.random() * 0.6 + 0.1,
  };

  const hue = getRandomHue();
  const colorBase = hslToHex(hue, 100, 50);
  const colorDarker = hslToHex(hue, 100, 40);
  const colorLighter = hslToHex(hue, 100, 65);

  const size = Math.floor(Math.random() * 21
      * Math.min(window.innerWidth, window.innerHeight) / 700) + 10;

  void confetti({
    particleCount: 200,
    startVelocity: size,
    gravity: 0.25,
    scalar: 0.75,
    spread: 360,
    colors: [colorBase, colorDarker, colorLighter],
    origin,
    disableForReducedMotion: true,
  });

  void confetti({
    particleCount: 100,
    startVelocity: size * 0.5,
    gravity: 0.25,
    scalar: 0.75,
    spread: 360,
    colors: [colorBase, colorDarker, colorLighter],
    origin,
    disableForReducedMotion: true,
  });
}

/**
 * Gets the list of available country codes to quiz on for the given level
 * @param independentOnly Whether to only select from independent countries
 * @param storedCountryData The country data to select from
 * @param level The quiz level which determines the obscurity of countries to select
 * @returns The filtered list of country codes
 */
export function getCountryCodesFilteredForQuizLevel(independentOnly: boolean,
    storedCountryData: CountryStorage, level: number) {
  const familiarityRankings = independentOnly ? storedCountryData.rankings.independentOnly.byFamiliarity
      : storedCountryData.rankings.all.byFamiliarity;

  let countryCodes: Cca3Code[];

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

  return countryCodes;
}

/**
 * Randomly selects country codes for a quiz.
 * @param availableCountryCodes The country codes to select from
 * @param storedCountryData The country data to select from
 * @param count The number of countries to select
 * @param quizType Type of the quiz, which may require special handling
 * @param fieldToRequire Optional field to require selected countries to have a value for.
 * Must be part of the shallow data expected to already be loaded.
 * @param valueArrayFunction Optional function to get the raw value array, if any
 * @param valueFunctionForPreventingDuplicates Optional function to get the value to use
 * for preventing duplicates.  Must be part of the shallow data expected to already be loaded,
 * and only applies if fieldToRequire is specified.
 * @returns The randomly selected country codes and secondary indexes if any
 */
export function getRandomCountryCodes(availableCountryCodes: Cca3Code[], storedCountryData: CountryStorage,
    count: number, quizType: QuizType, fieldToRequire?: keyof StoredCountry,
    valueArrayFunction?: ((storedCountryData: CountryStorage, cca3: Cca3Code) => string[] | undefined),
    valueFunctionForPreventingDuplicates?: ((storedCountryData: CountryStorage, cca3: Cca3Code) => string)
        | ((storedCountryData: CountryStorage, cca3: Cca3Code) => number)): [Cca3Code[], number[] | undefined] {
  const countriesData = storedCountryData.countries;
  let countryCodes: Cca3Code[] = [...availableCountryCodes];

  if (fieldToRequire) {
    countryCodes = countryCodes.filter(cca3 => countriesData[cca3]?.data?.[fieldToRequire]);
  }

  let selectedCountryCodes: (Cca3Code | undefined)[] = [];
  const countryCodeSecondaryIndexes: number[] = [];

  if (quizType === "MATCH_TO_BORDERING_COUNTRIES") {
    // Make sure at least two of the selected countries have bordering countries
    // and that the total number of bordering countries among all selected countries
    // is between the count and 1.5 times the count

    function getCountriesWithBorderingCountries(countryCodes: (Cca3Code | undefined)[],
        min = 1, max = Infinity) {
      return countryCodes.filter(cca3 => {
        const numBorders = cca3 ? storedCountryData.countries[cca3]?.data?.borders?.length ?? 0 : 0;
        return cca3 && numBorders >= min && numBorders <= max;
      }) as Cca3Code[];
    }

    const maxBorderingCountries = Math.round(count * 1.5);
    const minCountriesWithBorders = 2;
    countryCodes = getCountriesWithBorderingCountries(countryCodes, 0, maxBorderingCountries - 1);

    // Naive approach
    /* for (let i = 0; i < 100; i++) {
      let countForAttempt = count;
      const countryCodesForAttempt = [...countryCodes];

      while (countryCodesForAttempt.length && countForAttempt > 0) {
        selectedCountryCodes.push(extractRandomArrayElement<Cca3Code>(countryCodesForAttempt));
        countForAttempt--;
      }

      const totalBorderingCountries = selectedCountryCodes.map(cca3 =>
          cca3 ? storedCountryData.countries[cca3]?.data?.borders ?? [] : []).flat().length;

      if (totalBorderingCountries >= count && totalBorderingCountries <= maxBorderingCountries
          && getCountriesWithBorderingCountries(selectedCountryCodes).length >= 2) {
        console.log("A ATTEMPTS:", i + 1, "TOTAL:", totalBorderingCountries);
        break;
      }

      selectedCountryCodes = [];
    } */

    if (selectedCountryCodes.length < count) {
      // console.log("A ATTEMPTS:", "100+");

      // Controlled approach
      for (let i = 0; i < 100; i++) {
        let countForAttempt = count;
        let bordersAllowed = maxBorderingCountries - minCountriesWithBorders;
        let countryCodesForAttempt =
            getCountriesWithBorderingCountries(countryCodes, 1, bordersAllowed);

        while (countryCodesForAttempt.length) {
          selectedCountryCodes.push(extractRandomArrayElement<Cca3Code>(countryCodesForAttempt));
          countForAttempt--;

          if (countForAttempt <= 0) {
            break;
          }

          const selectedBorderingCountries = selectedCountryCodes.map(cca3 =>
              cca3 ? storedCountryData.countries[cca3]?.data?.borders ?? [] : []).flat().length;
          bordersAllowed = maxBorderingCountries - selectedBorderingCountries
              - Math.max(0, minCountriesWithBorders - (count - countForAttempt));
          let minBorders = 0;

          if (countForAttempt > count - minCountriesWithBorders) {
            minBorders = 1;
          } else if (countForAttempt < 2) {
            minBorders = Math.max(0, count - selectedBorderingCountries);
          }

          countryCodesForAttempt =
              getCountriesWithBorderingCountries(countryCodes, minBorders, bordersAllowed)
              .filter(cca3 => !selectedCountryCodes.includes(cca3));
        }

        const totalBorderingCountries = selectedCountryCodes.map(cca3 =>
            cca3 ? storedCountryData.countries[cca3]?.data?.borders ?? [] : []).flat().length;

        if (totalBorderingCountries >= count && totalBorderingCountries <= maxBorderingCountries
            && getCountriesWithBorderingCountries(selectedCountryCodes).length >= minCountriesWithBorders) {
          break;
        }

        console.error("Borders quiz country selection failed:", selectedCountryCodes);
        selectedCountryCodes = [];
      }
    }
  } else {
    const allowDuplicateCountryCodes = quizType === "MATCH_TO_FUN_FACTS" && !!valueArrayFunction;
    const duplicatesCount: Record<string | number, number> = {};
    const availableSecondaryIndexes: Partial<Record<Cca3Code, number[]>> = {};

    while (countryCodes.length && count > 0) {
      const extractedCountryCode = allowDuplicateCountryCodes ?
          getRandomArrayElement<Cca3Code>(countryCodes)
          : extractRandomArrayElement<Cca3Code>(countryCodes);
      selectedCountryCodes.push(extractedCountryCode);
      count--;

      if (extractedCountryCode && fieldToRequire && valueFunctionForPreventingDuplicates) {
        const value = valueFunctionForPreventingDuplicates(storedCountryData, extractedCountryCode);

        if (duplicatesCount[value] != null && duplicatesCount[value] > 0) {
          duplicatesCount[value]++;
        } else {
          duplicatesCount[value] = 1;
        }

        if (allowDuplicateCountryCodes) {
          // Assign if not defined
          availableSecondaryIndexes[extractedCountryCode] ??=
              valueArrayFunction(storedCountryData, extractedCountryCode)
              ?.map((_, index) => index) ?? [0];

          const indexArray = availableSecondaryIndexes[extractedCountryCode];
          const randomSecondaryIndex = extractRandomArrayElement<number>(indexArray) ?? 0;
          countryCodeSecondaryIndexes.push(randomSecondaryIndex);

          if (!indexArray.length) {
            // No other values available for this country
            removeElementFromArray(countryCodes, extractedCountryCode);
          }
        }

        // Don't allow any more country codes with match values equaling this one
        if (duplicatesCount[value] >= QUIZ_MAX_DUPLICATE_MATCH_VALUES) {
          // Value function secondary index defaults to 0, so doesn't really support
          // filtering duplicates of values that use secondary indexes,
          // but fun facts at least have no duplicates anyway
          countryCodes = countryCodes.filter(cca3 =>
              valueFunctionForPreventingDuplicates(storedCountryData, cca3) !== value);
        }
      }
    }
  }

  return [selectedCountryCodes.filter(Boolean) as Cca3Code[],
      countryCodeSecondaryIndexes.length ? countryCodeSecondaryIndexes : undefined];
}
