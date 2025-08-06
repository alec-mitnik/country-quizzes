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
