import React, { type PropsWithChildren } from "react";

/**
 * Selects a random element from the given array without modifying the array
 * @param array The array to select from
 * @returns The randomly selected element
 */
export function getRandomArrayElement<T>(array: T[]) {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Extracts a random element from the given array and returns it
 * @param array The array to extract from
 * @returns The randomly selected element
 */
export function extractRandomArrayElement<T>(array: T[]) {
  const randomIndex = Math.floor(Math.random() * array.length);
  return array.splice(randomIndex, 1)[0];
}

/**
 * Converts the given cardinal number (e.g. 1, 2, 3)
 * into its ordinal string (e.g. 1st, 2nd, 3rd)
 * @param n The cardinal number to convert
 * @returns The ordinal string
 */
export function convertToOrdinal(n: number) {
  const suffixMap: Record<number, string> = {
    1: "st",
    2: "nd",
    3: "rd",
  };

  const stringN = String(n);
  const singlesDigit = parseInt(stringN.charAt(stringN.length - 1));
  const tensDigit = stringN.length > 1 ? parseInt(stringN.charAt(stringN.length - 2)) : 0;

  // If the tens digit is 1 (10-19), always use "th"
  if (tensDigit === 1) {
    return `${n}th`;
  }

  return `${n}${suffixMap[singlesDigit] || "th"}`;
}

/**
 * Converts a ReactNode into a usable value for a rendering key
 * @param node The ReactNode to convert to a usable key
 * @param [fallback='unknown'] Fallback string to use if the node can't be converted
 * @returns A string representation of the ReactNode that can be used as a key
 */
export function getReactNodeKey(node: React.ReactNode, fallback = 'unknown'): string {
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }

  if (React.isValidElement(node)) {
    const props = node.props as PropsWithChildren;

    // Use props.children if it's a string, otherwise use fallback
    if (typeof props.children === 'string') {
      return props.children;
    }

    return `${String(node.type)}_${fallback}`;
  }

  return fallback;
}

/**
 * Gets the locator map source for the given World Factbook country key.
 * Note that the World Factbook doesn't have entries for the following,
 * so I use fake keys for missing or unusable locator maps that I replaced
 * with ones I cobbled together:
 * Caribbean Netherlands (separated, so I combined them)
 * French Guiana (this and the others are treated as part of France)
 * Martinique
 * Mayotte
 * Guadeloupe
 * Réunion
 * Palestine (separated as Gaza Strip and West Bank, so I combined them)
 * Western Sahara (needed to separate from Morocco)
 * Åland Islands (needed to separate from Finland)
 * United States Minor Outlying Islands (needed to combine Navassa Island,
 *     Wake Island, and United States Pacific Island Wildlife Refuges)
 * Svalbard and Jan Mayen (separated, so I combined them)
 * Their locator map for Sint Maarten is also erroneously a copy of Curacao's,
 * so a slightly tweaked version of the Saint Martin map is used as a replacement for that.
 * Also edited the map for Israel to give it a callout box for clarity.
 *
 * For reference, the full URL for the locator map on the World Factbook website
 * would be the same filename prefixed with:
 * https://www.cia.gov/the-world-factbook/static/locator-maps/
 *
 * @param worldFactbookCountryKey The country code used by the World Factbook website
 * (not any standardized country code)
 * @returns The src path for the corresponding country's locator map (stored locally)
 */
export function getLocatorMapSrc(worldFactbookCountryKey: string) {
  return `/images/locatorMaps/${worldFactbookCountryKey}-locator-map.jpg`;
}
