import type { Cca3Code, Country } from "@yusifaliyevpro/countries/types";
import type { StoredCountry } from "../CountriesProvider";
import { SQUARE_KM_PER_SQUARE_MILE } from "./consts";
import { convertToOrdinal } from "./utils";

/*
For reference, partial typed data info for Country from the API:

type Country = {
  code: Cca3Code;                        // e.g. "USA"
  name: {
    common: string;                      // e.g. "United States"
    official: string;
    nativeName?: Record<string, {
      official: string;
      common: string;
    }>;
  };
  independent: boolean;
  currencies?: Record<string, {          // e.g. { USD: { name: "United States dollar", symbol: "$" } }
    name: string;
    symbol: string;
  }>;
  capital?: Capital[];                   // e.g. ["Washington, D.C."]
  languages?: Record<string, string>;    // e.g. { eng: "English" }
  borders?: Cca3Code[];                  // e.g. ["CAN", "MEX"]
  area: number;                          // e.g. 9372610 (square km)
  population: number;                    // e.g. 329484123
  continents: string[];                  // e.g. ["North America"]
  flags: {
    png: string;                         // URL
    svg: string;                         // URL
    alt?: string;                        // Description of flag, typically starting like:
                                         // "The flag of the United States of America is composed of..."
  };
}
*/

export function getRankAccountingForTies(rankedArray: Cca3Code[], cca3: Cca3Code,
    valueFunction: (cca3: Cca3Code) => number) {
  let index = rankedArray.indexOf(cca3);

  // Walk back until we find an entry with a different value.
  while (index > 0 && valueFunction(rankedArray[index - 1]) === valueFunction(cca3)) {
    index--;
  }

  return index + 1;
}

export function formatCountryDataArray(value: string[] | undefined) {
  return value?.length ? value.join(", ") : "None";
}

export type CurrenciesData = Record<string, { symbol: string, term: string }>;

export function extractCurrencies(country: Partial<Country>) {
  // Keep separate references to the currency symbol and term
  // so that the symbol can be hidden from screen readers
  const currencies: CurrenciesData = {};

  if (country?.currencies) {
    for (const valueEntry of Object.values({...country.currencies})) {
      if (valueEntry.symbol && valueEntry.name) {
        // Extract currencies using just the last word ("dollar" vs. "United States dollar")
        // For the purpose of quizzing on
        const nameArray = valueEntry.name.split(" ");
        const currencyTerm = nameArray[nameArray.length - 1];

        // This prevents duplicates (in the case of e.g. multiple types of $ dollar)
        // and can also be used for simple string comparison for matching
        const formattedValue = `${valueEntry.symbol} (${currencyTerm})`;

        currencies[formattedValue] = {
          symbol: valueEntry.symbol,
          term: currencyTerm,
        };
      }
    }
  }

  return currencies;
}

export function extractLanguages(country: Partial<Country>) {
  let languages: string[] = [];

  if (country?.languages) {
    languages = Object.values({...country?.languages})
        .filter(language => language);
  }

  return languages;
}

/**
 * Extracts the flag's alt description while obfuscating the country name within it
 * @param country The country data to extract from
 * @returns The edited alt description for the flag
 */
export function extractFlagAltDescription(country: Partial<Country>) {
  if (!country.name) {
    return undefined;
  }

  let flagDescription = country?.flags?.alt;
  const countryName = country?.name?.common;

  if (flagDescription) {
    const countryNames = [countryName, `the ${countryName}`];

    if (country.name.official) {
      countryNames.push(country.name.official, `the ${country.name.official}`);
    }

    // Sort names by length, longest first
    countryNames.sort((a, b) => b.length - a.length);

    // Replace the country name (case insensitive) with "this country" to obfuscate it,
    // enabling quizzing while remaining accessible

    // First, try to replace statements like "The flag of the Islamic Emirate of Afghanistan"
    for (const name of countryNames) {
      // Use non-greedy quantifier *? to match the shortest possible string
      const regexName = `^The flag of .*?${name}`;
      // Replace only once if at the start of the string (case insensitive)
      flagDescription = flagDescription?.replace(new RegExp(regexName, "i"), "The flag of this country");
    }

    // Then just try to replace any mentions of the country name
    for (const name of countryNames) {
      // Replace globally and case-insensitively
      flagDescription = flagDescription?.replace(new RegExp(name, "gi"), "this country");
    }
  } else {
    // Ensure that countries with missing flag descriptions can be detected
    // and filtered out of flag-based quiz selection
    flagDescription = undefined;
  }

  return flagDescription;
}

/**
 * Sets the area labels for stored country data, incorporating rankings
 * @param country Stored country data to set the labels to
 * @param areaValueFunction Function to get the area value from the country code
 * @param rankingsByAreaAll All countries sorted by area
 * @param rankingsByAreaIndependentOnly Independent countries sorted by area
 */
export function setAreaLabels(country: Partial<StoredCountry> | undefined,
    areaValueFunction: (cca3: Cca3Code) => number,
    rankingsByAreaAll: Cca3Code[], rankingsByAreaIndependentOnly: Cca3Code[]) {
  if (!country?.area || !country.cca3) {
    return;
  }

  const area = country.area.rawValue;
  let sqMi = 0;

  if (area != null) {
    const rawSqMi = area / SQUARE_KM_PER_SQUARE_MILE;

    if (rawSqMi < 1) {
      // If less than 1 (Vatican City), round to a single decimal
      sqMi = Math.round(rawSqMi * 10) / 10;
    } else {
      sqMi = Math.round(rawSqMi);
    }
  }

  const areaLabelWithoutRank = area != null ?
      `${sqMi.toLocaleString()
      } sq mi (${area.toLocaleString()} sq km)` : undefined;

  const sizeRankAll = getRankAccountingForTies(rankingsByAreaAll,
      country.cca3, areaValueFunction);
  const sizeRankIndependentOnly =
      getRankAccountingForTies(rankingsByAreaIndependentOnly,
      country.cca3, areaValueFunction);

  let sizeRankAllText = "";
  if (sizeRankAll > 0) {
    const sizeRankOrdinal = convertToOrdinal(sizeRankAll);
    sizeRankAllText = ` — ${sizeRankOrdinal} largest`;
  }

  let sizeRankIndependentOnlyText = "";
  if (sizeRankIndependentOnly > 0) {
    const sizeRankOrdinal = convertToOrdinal(sizeRankIndependentOnly);
    sizeRankIndependentOnlyText = ` — ${sizeRankOrdinal} largest`;
  }

  country.area = {
    ...country.area,
    formattedValueForAll: areaLabelWithoutRank ?
        `${areaLabelWithoutRank}${sizeRankAllText}` : "Unknown",
    formattedValueForIndependentOnly: areaLabelWithoutRank ?
        `${areaLabelWithoutRank}${sizeRankIndependentOnlyText}` : "Unknown",
  };
}

/**
 * Sets the population labels for stored country data, incorporating rankings
 * @param country Stored country data to set the labels to
 * @param populationValueFunction Function to get the population value from the country code
 * @param rankingsByPopulationAll All countries sorted by population
 * @param rankingsByPopulationIndependentOnly Independent countries sorted by population
 */
export function setPopulationLabels(country: Partial<StoredCountry> | undefined,
    populationValueFunction: (cca3: Cca3Code) => number,
    rankingsByPopulationAll: Cca3Code[], rankingsByPopulationIndependentOnly: Cca3Code[]) {
  if (!country?.population || !country.cca3) {
    return;
  }

  const population = country.population?.rawValue;
  const populationLabelWithoutRank = population != null ?
      `${population.toLocaleString()} people` : undefined;

  const populationRankAll =
      getRankAccountingForTies(rankingsByPopulationAll,
      country.cca3, populationValueFunction);
  const populationRankIndependentOnly =
      getRankAccountingForTies(rankingsByPopulationIndependentOnly,
      country.cca3, populationValueFunction);

  let populationRankAllText = "";
  if (populationRankAll > 0) {
    const populationRankOrdinal = convertToOrdinal(populationRankAll);
    populationRankAllText = ` — ${populationRankOrdinal} largest`;
  }

  let populationRankIndependentOnlyText = "";
  if (populationRankIndependentOnly > 0) {
    const populationRankOrdinal = convertToOrdinal(populationRankIndependentOnly);
    populationRankIndependentOnlyText = ` — ${populationRankOrdinal} largest`;
  }

  country.population = {
    ...country.population,
    formattedValueForAll: populationLabelWithoutRank ?
        `${populationLabelWithoutRank}${populationRankAllText}` : "Unknown",
    formattedValueForIndependentOnly: populationLabelWithoutRank ?
        `${populationLabelWithoutRank}${populationRankIndependentOnlyText}` : "Unknown",
  };
}
