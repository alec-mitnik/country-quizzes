import React, { type PropsWithChildren } from "react";

/**
 * For when filter can't be used because there can be duplicates
 * and you only want to remove one
 * @param array Array to remove the first match from
 * @param value Value to remove
 */
export function removeFirstMatchFromArray<T>(array: T[], value: T) {
  const index = array.indexOf(value);

  if (index > -1) {
    array.splice(index, 1);
  }
}

/**
 * Removes the first instance of the given element from the given array
 * @param array The array to extract from
 * @param element The element to extract
 */
export function removeElementFromArray<T>(array: T[], element: T) {
  const index = array.indexOf(element);

  if (index < 0) {
    return;
  }

  array.splice(index, 1);
}

/**
 * Selects a random element from the given array without modifying the array
 * @param array The array to select from
 * @returns The randomly selected element
 */
export function getRandomArrayElement<T>(array: T[]) {
  if (!array?.length) {
    return undefined;
  }

  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Extracts a random element from the given array and returns it
 * @param array The array to extract from
 * @returns The randomly selected element
 */
export function extractRandomArrayElement<T>(array: T[]) {
  if (!array?.length) {
    return undefined;
  }

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
 * Rounds a number to a given precision, in this case meaning the sum
 * of the allowed decimal places plus significant digits
 * @param num The number to round
 * @param precision The sum of the allowed decimal places + significant digits
 * @returns The rounded number
 */
export function roundToPrecision(num: number, precision: number) {
  if (isNaN(num)) {
    return NaN;
  } else if (num === Infinity || num === -Infinity) {
    return num;
  } else if (num === 0) {
    return 0;
  }

  const absNum = Math.abs(num);

  // Count significant digits
  const firstSignificantDigitPos = Math.floor(Math.log10(absNum));
  const significantDigits = firstSignificantDigitPos >= 0 ? firstSignificantDigitPos + 1 : 1;

  // Calculate decimal places needed
  const decimalPlaces = Math.max(0, precision - significantDigits);

  return parseFloat(num.toFixed(decimalPlaces));
}

/**
 * Gets the number of decimal places for the given number
 * @param num The number to get decimal places for
 * @returns The number of decimal places
 */
export function getDecimalPlaces(num: number) {
  if (isNaN(num) || num === Infinity || num === -Infinity) {
    return NaN;
  }

  const str = num.toString();
  return str.includes('.') ? str.split('.')[1].length : 0;
}

/**
 * Formats the given number as a locale string
 * while ensuring the precision is preserved
 * @param num The number to format
 * @returns The formatted locale string with precision preserved
 */
export function toPreciseLocaleString(num: number) {
  const decimalPlaces = getDecimalPlaces(num);

  return num.toLocaleString(undefined, {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  });
}

/**
 * Converts a ReactNode into a string value
 * @param node The ReactNode to convert
 * @param [fallback='unknown'] Fallback string to use if the node can't be converted
 * @returns A string representation of the ReactNode that can be used as a rendering key
 */
export function getReactNodeString(node: React.ReactNode, fallback = 'unknown'): string {
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
 * Edited the map for Israel to give it a callout box for clarity.
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

/**
 * Generates a random hue for HSL colors
 * @returns A random number between 0 and 360
 */
export function getRandomHue(): number {
  return Math.floor(Math.random() * 360);
}

/**
 * Converts an HSL color to a hexadecimal string
 * @param h Hue as a number 0-360
 * @param s Saturation as a number 0-100
 * @param l Lightness as a number 0-100
 * @returns Hexadecimal string representation of the HSL color
 */
export function hslToHex(h: number, s: number, l: number): string {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}
