import { useCallback, useState } from "react";

/**
 * Creates a state and setState function that are kept in sync
 * with a localStorage boolean value
 * @param {string} propertyName Name of the localStorage key
 * @returns The state and setState function
 */
function useLocalStorageStateBoolean(propertyName: string) {
  // Load from and save to local storage
  const [state, setStateInternal] = useState(
      localStorage.getItem(propertyName) === "true");

  const setState = useCallback((state: boolean) => {
    setStateInternal(state);
    localStorage.setItem(propertyName, state.toString());
  }, [setStateInternal, propertyName]);

  // Use `as const` to strongly type each array element individually
  // rather than have them all typed as a union of all possible types
  return [state, setState] as const;
}

/**
 * Creates a state and setState function that are kept in sync
 * with a localStorage number value
 * @param {string} propertyName Name of the localStorage key
 * @param {number} defaultValue Default value to use if not in localStorage
 * @returns The state and setState function
 */
function useLocalStorageStateNumber(propertyName: string, defaultValue: number) {
  // Load from and save to local storage
  const [state, setStateInternal] = useState(
      parseFloat(localStorage.getItem(propertyName) ?? String(defaultValue)));

  const setState = useCallback((state: number) => {
    setStateInternal(state);
    localStorage.setItem(propertyName, String(state));
  }, [setStateInternal, propertyName]);

  // Use `as const` to strongly type each array element individually
  // rather than have them all typed as a union of all possible types
  return [state, setState] as const;
}

/**
 * Creates a state and setState function that are kept in sync
 * with a localStorage string value
 * @param {string} propertyName Name of the localStorage key
 * @param {string} defaultValue Default value to use if not in localStorage
 * @returns The state and setState function
 */
function useLocalStorageStateString(propertyName: string, defaultValue: string) {
  // Load from and save to local storage
  const [state, setStateInternal] = useState(
      localStorage.getItem(propertyName) ?? defaultValue);

  const setState = useCallback((state: string) => {
    setStateInternal(state);
    localStorage.setItem(propertyName, state);
  }, [setStateInternal, propertyName]);

  // Use `as const` to strongly type each array element individually
  // rather than have them all typed as a union of all possible types
  return [state, setState] as const;
}

/**
 * Creates a state and setState function that are kept in sync
 * with a localStorage JSON stringified value.
 * Note that the state value must support JSON serialization.
 * @param {string} propertyName Name of the localStorage key
 * @param {T} defaultValue Default value to use if not in localStorage
 * @param {function} replacerFunction Optional function to apply to the state value before saving
 * @param {function} reviverFunction Optional function to apply to the state value after loading
 * @returns The state and setState function
 */
function useLocalStorageStateObject<T>(propertyName: string, defaultValue: T,
    replacerFunction?: (key: string, value: unknown) => unknown,
    reviverFunction?: (key: string, value: unknown) => unknown) {
  // Load from and save to local storage
  const [state, setStateInternal] = useState<T>(() => {
    const value = localStorage.getItem(propertyName);

    if (value) {
      return JSON.parse(value, reviverFunction) as T;
    }

    return defaultValue;
  });

  const setState = useCallback((state: T) => {
    setStateInternal(state);
    localStorage.setItem(propertyName, JSON.stringify(state, replacerFunction));
  }, [setStateInternal, propertyName, replacerFunction]);

  // Use `as const` to strongly type each array element individually
  // rather than have them all typed as a union of all possible types
  return [state, setState] as const;
}

export {
  useLocalStorageStateBoolean, useLocalStorageStateNumber,
  useLocalStorageStateObject, useLocalStorageStateString
};
