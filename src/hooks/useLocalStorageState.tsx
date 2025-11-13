import { useCallback, useState } from "react";

/**
 * Tests whether local storage is available
 * @returns Whether a test of local storage access succeeded
 */
function isLocalStorageAvailable() {
  let storage: Storage | null = null;

  try {
    storage = window.localStorage;
    const x = "__storage_test__";
    storage.setItem(x, x);
    storage.removeItem(x);
    return true;
  } catch (e) {
    return (
      e instanceof DOMException &&
      e.name === "QuotaExceededError" &&
      // acknowledge QuotaExceededError only if there's something already stored
      storage &&
      storage.length !== 0
    );
  }
}

/**
 * Safely try to save to local storage
 * @param key {string} local storage key
 * @param data {string} data to save
 */
function saveData(key: string, data: string) {
  try {
    localStorage.setItem(key, data);
  } catch (e) {
    // console.warn(`Unable to save '${key}' to local storage:`, e);
    console.warn("Unable to save to local storage:", e);
  }
}

/**
 * Safely try to load from local storage
 * @param key {string} local storage key
 * @param fallback optional fallback value if data could not be loaded
 * @returns The loaded data or the fallback value
 */
function loadData(key: string, fallback = "") {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch (e) {
    // console.warn(`Unable to load '${key}' from local storage:`, e);
    console.warn("Unable to load from local storage:", e);
    return fallback;
  }
}

/**
 * Creates a state and setState function that are kept in sync
 * with a localStorage boolean value
 * @param {string} propertyName Name of the localStorage key
 * @returns The state and setState function
 */
function useLocalStorageStateBoolean(propertyName: string) {
  // Load from and save to local storage
  const [state, setStateInternal] = useState(loadData(propertyName, "false") === "true");

  const setState = useCallback((state: boolean) => {
    setStateInternal(state);
    saveData(propertyName, String(state));
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
      parseFloat(loadData(propertyName, String(defaultValue))));

  const setState = useCallback((state: number) => {
    setStateInternal(state);
    saveData(propertyName, String(state));
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
  const [state, setStateInternal] = useState(loadData(propertyName, defaultValue));

  const setState = useCallback((state: string) => {
    setStateInternal(state);
    saveData(propertyName, state);
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
    const value = loadData(propertyName);

    if (value) {
      try {
        return JSON.parse(value, reviverFunction) as T;
      } catch (_e) {
        // Just use default value
      }
    }

    return defaultValue;
  });

  const setState = useCallback((state: T) => {
    setStateInternal(state);
    saveData(propertyName, JSON.stringify(state, replacerFunction));
  }, [setStateInternal, propertyName, replacerFunction]);

  // Use `as const` to strongly type each array element individually
  // rather than have them all typed as a union of all possible types
  return [state, setState] as const;
}

export {
  isLocalStorageAvailable, useLocalStorageStateBoolean, useLocalStorageStateNumber,
  useLocalStorageStateObject, useLocalStorageStateString
};
