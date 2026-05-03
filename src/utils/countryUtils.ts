import type { Cca3Code, Country } from "@yusifaliyevpro/countries/types";
import type { FormattedCountryField, StoredCountry, StoredCountryWrapper } from "../../types/commonTypes";
import type { CountryStorage } from "../CountriesProvider";
import { SQUARE_KM_PER_SQUARE_MILE } from "./consts";
import { convertToOrdinal, roundToPrecision, toPreciseLocaleString } from "./utils";

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

/**
 * Gets the rank of the given country in the given ranked array, accounting for ties
 * @param rankedArray Array of country codes sorted by rank
 * @param cca3 Country code to get the rank for
 * @param valueFunction Function for deriving the value being ranked
 * @returns Ranking of the country accounting for ties
 */
export function getRankAccountingForTies(rankedArray: Cca3Code[], cca3: Cca3Code,
    valueFunction: (cca3: Cca3Code) => number) {
  let index = rankedArray.indexOf(cca3);

  // Walk back until we find an entry with a different value.
  while (index > 0 && valueFunction(rankedArray[index - 1]!) === valueFunction(cca3)) {
    index--;
  }

  return index + 1;
}

/**
 * Gets the formatted string for an array of values
 * @param value Array of string values
 * @returns A comma separated list of values or "None"
 */
export function formatCountryDataArray(value: string[] | undefined) {
  return value?.length ? value.join(", ") : "None";
}

export type CurrenciesData = Record<string, { symbol: string, term: string }>;

/**
 * Extracts currencies data from the given country
 * @param country Partial country to extract currencies from
 * @returns Extracted currencies data
 */
export function extractCurrencies(country: Partial<Country>) {
  // Keep separate references to the currency symbol and term
  // so that the symbol can be hidden from screen readers
  let currencies: CurrenciesData = {};

  if (country?.currencies) {
    for (const valueEntry of Object.values({...country.currencies})) {
      if (valueEntry.symbol && valueEntry.name) {
        // Extract currencies using just the last word ("dollar" vs. "United States dollar")
        // For the purpose of quizzing on
        const nameArray = valueEntry.name.split(" ");
        let currencyTerm = nameArray[nameArray.length - 1]!;

        if (country.cca3 === "VEN") {
          // For Venezuela, the REST Countries API gives "Venezuelan bolívar soberano",
          // but the common term seems to be "bolívar."
          currencyTerm = "bolívar";
        }

        // This prevents duplicates (in the case of e.g. multiple types of $ dollar)
        // and can also be used for simple string comparison for matching
        const formattedValue = `${valueEntry.symbol} (${currencyTerm})`;

        currencies[formattedValue] = {
          symbol: valueEntry.symbol,
          term: currencyTerm,
        };
      }
    }

    // Sort alphabetically by term
    currencies = Object.fromEntries(
        Object.entries(currencies).sort((a, b) => a[1].term.localeCompare(b[1].term)));
  }

  return currencies;
}

/**
 * Extracts languages from the given country
 * @param country Partial country to extract languages from
 * @returns Extracted languages, sorted alphabetically
 */
export function extractLanguages(country: Partial<Country>) {
  let languages: string[] = [];

  if (country?.languages) {
    languages = Object.values({...country?.languages}).filter(Boolean);

    // Sort alphabetically
    languages.sort((a, b) => a.localeCompare(b));
  }

  return languages;
}

/**
 * Sorts an array of strings alphabetically and filters out falsy values
 * @param values Array of strings to sort
 * @returns Sorted array
 */
export function extractAlphabeticalStringArray(values: string[] | undefined) {
  const sortedValues = values?.filter(Boolean).sort((a, b) => a.localeCompare(b)) ?? undefined;
  return sortedValues;
}

/**
 * Gets the country name for the given country code
 * @param cca3 Country code to get the name for
 * @param storedCountries Stored country data containing the country names
 * @returns The country name
 */
export function getCountryNameFromCode(cca3: Cca3Code,
    storedCountries: Partial<Record<Cca3Code, StoredCountryWrapper>>) {
  return storedCountries[cca3]?.data?.name ?? cca3;
}

/**
 * Sorts the given country codes by name
 * @param countryCodes Country codes to sort
 * @param storedCountries Stored country data containing the country names
 */
export function sortCountryCodesByName(countryCodes: Cca3Code[],
    storedCountries: Partial<Record<Cca3Code, StoredCountryWrapper>>) {
  countryCodes.sort((a, b) => getCountryNameFromCode(a, storedCountries)
      ?.localeCompare(getCountryNameFromCode(b, storedCountries)));
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
      const regex = new RegExp(`^The flag of .*?${name}`);

      if (regex.test(flagDescription)) {
        // Replace only once if at the start of the string (case insensitive)
        flagDescription = flagDescription?.replace(regex, "The flag of this country");
        break;
      }
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

/**
 * Sets the population density labels for stored country data, incorporating rankings
 * @param country Stored country data to set the labels to
 * @param populationDensityValueFunction Function to get the population density value from the country code
 * @param rankingsByPopulationDensityAll All countries sorted by population
 * @param rankingsByPopulationDensityIndependentOnly Independent countries sorted by population
 */
export function setPopulationDensityLabels(country: Partial<StoredCountry> | undefined,
    populationDensityValueFunction: (cca3: Cca3Code) => number,
    rankingsByPopulationDensityAll: Cca3Code[],
    rankingsByPopulationDensityIndependentOnly: Cca3Code[]) {
  if (!country?.population || !country.area || !country.cca3) {
    return;
  }

  const population = country.population?.rawValue;
  const area = country.area?.rawValue;

  const populationDensity = population != null && area != null ?
      getPopulationDensityValue(population, area) : undefined;
  const populationDensityMiles = population != null && area != null ?
      getPopulationDensityValue(population, area / SQUARE_KM_PER_SQUARE_MILE) : undefined;

  const populationDensityLabelWithoutRank = populationDensity != null && populationDensityMiles != null ?
      `${toPreciseLocaleString(populationDensityMiles)} people per sq mi (${
      toPreciseLocaleString(populationDensity)} people per sq km)` : undefined;

  const populationDensityRankAll =
      getRankAccountingForTies(rankingsByPopulationDensityAll,
      country.cca3, populationDensityValueFunction);
  const populationDensityRankIndependentOnly =
      getRankAccountingForTies(rankingsByPopulationDensityIndependentOnly,
      country.cca3, populationDensityValueFunction);

  let populationDensityRankAllText = "";
  if (populationDensityRankAll > 0) {
    const populationRankOrdinal = convertToOrdinal(populationDensityRankAll);
    populationDensityRankAllText = ` — ${populationRankOrdinal} largest`;
  }

  let populationDensityRankIndependentOnlyText = "";
  if (populationDensityRankIndependentOnly > 0) {
    const populationRankOrdinal = convertToOrdinal(populationDensityRankIndependentOnly);
    populationDensityRankIndependentOnlyText = ` — ${populationRankOrdinal} largest`;
  }

  country.populationDensity = {
    ...country.populationDensity,
    formattedValueForAll: populationDensityLabelWithoutRank ?
        `${populationDensityLabelWithoutRank}${populationDensityRankAllText}` : "Unknown",
    formattedValueForIndependentOnly: populationDensityLabelWithoutRank ?
        `${populationDensityLabelWithoutRank}${populationDensityRankIndependentOnlyText}` : "Unknown",
  };
}

/**
 * Gets a country's population density value to a consistent precision
 * @param population Country population value
 * @param area Country size value
 * @returns Country population density value to a consistent precision
 */
export function getPopulationDensityValue(population: number | undefined, area: number | undefined) {
  if (!population || !area) {
    return 0;
  }

  const rawValue = population / area;
  return roundToPrecision(rawValue, rawValue < 1 ? 6 : 3);
}

export function getFieldReadableValue(storedCountryData: CountryStorage,
    cca3: Cca3Code, field: keyof StoredCountry, includeFieldLabel = false) {
  const prefix = includeFieldLabel ? `${getFieldLabel(storedCountryData, cca3, field)}: ` : "";

  let value = storedCountryData.countries[cca3]?.data?.[field];

  if (typeof value === "string") {
    return `${prefix}${value}`;
  }

  value = (value as FormattedCountryField<string[]>)?.formattedValue;

  if (!value || typeof value !== "string") {
    /* console.error(`Getting readable value for field that isn't a string and \
isn't a FormattedCountryField:`, field, value); */

    switch (field) {
      // Would depend on the independentOnly flag...
      /* case "area": {
        value = "";
        break;
      }
      case "population": {
        value = "";
        break;
      }
      case "populationDensity": {
        value = "";
        break;
      } */
      default: {
        console.error("Getting readable value for unsupported field:", field);
      }
    }
  }

  return `${prefix}${value}`;
}

/**
 * Gets the display label for a country field.  Note that when not in a pluralized context,
 * the label should still sometimes be pluralized based on the value,
 * so defers to the formattedLabel property when possible
 * @param field Country field to get the label for
 * @param storedCountryData Country storage data
 * @param cca3 Country code whose field is being displayed
 * @param lowercase Whether the label should be lowercase instead of title case
 * @returns The label string to display for the field
 */
export function getFieldLabel(storedCountryData: CountryStorage,
    cca3: Cca3Code, field: keyof StoredCountry, lowercase = false) {
  const value = storedCountryData.countries[cca3]?.data?.[field];
  let label = (value as FormattedCountryField<string[]>)?.label;

  if (!label) {
    switch (field) {
      case "location": {
        label = "Location";
        break;
      }
      case "flagDescription": {
        label = "Flag";
        break;
      }
      /* case "area": {
        label = "Size";
        break;
      }
      case "population": {
        label = "Total Population";
        break;
      }
      case "populationDensity": {
        label = "Population Density";
        break;
      } */
      default: {
        console.error("Getting non-pluralized label for unsupported field:", field);
      }
    }
  }

  return lowercase ? label.toLowerCase() : label;
}

/**
 * Gets the pluralized display label for a country field
 * @param field Country field to get the label for
 * @param lowercase Whether the label should be lowercase instead of title case
 * @returns The label string to display for the field
 */
export function getPluralFieldLabel(field: keyof StoredCountry, lowercase = false) {
  let label: string = field;

  switch (field) {
    case "location": {
      label = "Locations";
      break;
    }
    case "flagDescription": {
      label = "Flags";
      break;
    }
    case "capitals": {
      label = "Capitals";
      break;
    }
    case "currencies": {
      label = "Currencies";
      break;
    }
    /* case "area": {
      label = "Sizes";
      break;
    }
    case "population": {
      label = "Total Populations";
      break;
    }
    case "populationDensity": {
      label = "Population Densities";
      break;
    } */
    default: {
      console.error("Getting pluralized label for unsupported field:", field);
    }
  }

  return lowercase ? label.toLowerCase() : label;
}
