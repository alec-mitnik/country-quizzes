import { useEffect, useRef, useState } from "react";

/**
 * Creates a state and ref that are kept in sync, so that
 * the ref always contains the latest value of the state
 * and can be used by useEffects without being a dependency trigger.
 * Note that since the state needs a cycle to update, so does the ref,
 * so if immediate updates are needed, just use useRef directly.
 * @param initialValue Initial value for the state
 * @returns the results of a useState and useRef call,
 * with the ref kept in sync with the state
 */
function useStateRef<T>(initialValue: T) {
  const [state, setState] = useState(initialValue);
  const ref = useRef(state);

  useEffect(() => {
    ref.current = state;
  }, [state]);

  // Use `as const` to strongly type each array element individually
  // rather than have them all typed as a union of all possible types
  return [state, setState, ref] as const;
}

export default useStateRef;
