import React, { type PropsWithChildren } from "react";
import { flushSync } from "react-dom";

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
 * Formats the given string array as a standard list with "and" and an Oxford comma
 * @param array The string array to format
 * @returns The array formatted as a comma-separated list
 */
export function formatArrayAsCommaSeparatedString(array: string[]) {
  // Standard list formatting, so example outputs are
  // "apple" or "apple and banana" or "apple, banana, and orange".
  if (array.length < 2) {
    return array.join("");
  } else if (array.length === 2) {
    return array.join(" and ");
  } else {
    return array.slice(0, array.length - 1).join(", ") + ", and " + array[array.length - 1];
  }
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

function getReactNodeStringRecursive(node: React.ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }

  if (node instanceof Array) {
    return node.map(getReactNodeStringRecursive).join('');
  }

  if (React.isValidElement(node)) {
    const props = node.props as PropsWithChildren;

    if (props.children) {
      return getReactNodeStringRecursive(props.children);
    }
  }

  return '';
}

/**
 * Converts a ReactNode into a string value
 * @param node The ReactNode to convert
 * @param [fallback='unknown'] Fallback string to use if the node can't be converted
 * @returns A string representation of the ReactNode that can be used as a rendering key
 */
export function getReactNodeString(node: React.ReactNode, fallback = 'unknown'): string {
  return getReactNodeStringRecursive(node) || fallback;
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
 * Edited the maps for Jersey and Guernsey to improve clarity.
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

// 0 gives '0️⃣' (&#x30;&#xfe0f;&#x20e3;),
// 12 gives '1️⃣2️⃣' (&#x31;&#xfe0f;&#x20e3;&#x32;&#xfe0f;&#x20e3;), etc.
export function getEmojisForNumber(num: number): string {
  // Split the number into its digits
  const digits = num.toString().split('');

  // Convert each digit to an emoji
  const emojis = digits.map((digit) => String.fromCodePoint(0x30 + parseInt(digit))
      + String.fromCodePoint(0xfe0f) + String.fromCodePoint(0x20e3));

  return emojis.join('');
}

export function doesStringEndWithPunctuation(str: string): boolean {
  if (!str) {
    return false;
  };

  const lastChar = str[str.length - 1];
  return ['.', '?', '!'].includes(lastChar);
}

/**
 * Calls the given function within a view transition (if supported),
 * allowing for smooth transitions between states.  Doing multiple state updates within flushSync
 * can cause flickering, so move extra state updates to the callback if possible.
 * @param func Function to call within the view transition that will update the page state/layout
 * @param skipCondition If true, the view transition will be skipped
 * @param callback Function to call after the view transition is complete
 */
export function callFunctionWithViewTransition(func: () => void, skipCondition = false, callback?: () => void) {
  if (!document.startViewTransition || skipCondition) {
    func();
    callback?.();
  } else {
    const transition = document.startViewTransition(() => {
      // Calling flushSync is necessary for the view transition to work
      // eslint-disable-next-line react-dom/no-flush-sync
      flushSync(() => {
        func();
      });
    });

    if (callback) {
      transition.finished.then(() => {
        callback();
      }).catch(() => {
        callback();
      });
    }
  }
}
