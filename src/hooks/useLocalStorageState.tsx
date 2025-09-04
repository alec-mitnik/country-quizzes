import { useCallback, useState } from "react";

/**
 * Creates a state and setState function that are kept in sync
 * with a localStorage boolean value
 * @param propertyName Name of the localStorage key
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
 * with a localStorage string value
 * @param propertyName Name of the localStorage key
 * @param defaultValue Default value to use if not in localStorage
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

export { useLocalStorageStateBoolean, useLocalStorageStateString };
