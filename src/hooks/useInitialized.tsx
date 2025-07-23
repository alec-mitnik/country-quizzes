import { useEffect, useState } from "react";

/**
 * Tracks loading state for a component that is expected to load on initialization,
 * so it can show as loading from the get go, until the first time the loading state
 * goes from true to false or was bypassed due to data having already been loaded
 * @param loading The loading state that would get updated by the fetchOnLoadFunction
 * @param fetchOnLoadFunction A function to run once on mount, fetching data,
 * which sets the initialized state if it returns true (meaning data had already been loaded)
 * @returns Whether loaded and initialized
 */
function useInitialized(loading: boolean, fetchOnLoadFunction: () => boolean) {
  const [initializing, setInitializing] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (loading) {
      setInitializing(false);
    } else if (!initializing) {
      // If initializing is false, we've gone from loading being true to false,
      // so the initialized state can be marked as true
      setInitialized(true);
    } else if (fetchOnLoadFunction?.()) {
      // If the fetch function exists, call it once on load, and if it returns true,
      // the data had already been loaded, so mark initialized as true
      setInitializing(false);
      setInitialized(true);
    }
  }, [loading, initializing, setInitializing, setInitialized, fetchOnLoadFunction]);

  return !loading && initialized;
}

export default useInitialized;
