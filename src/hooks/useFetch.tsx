import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Represents an AbortController aborted due to unmounting or a newer request,
 * as opposed to e.g. a manual cancellation
 */
class StaleRequestError extends Error {
  override name = 'StaleRequestError';

  constructor() {
    super('Request stale');
  }
}

/**
 * Handles fetching data of the specified type
 * @param url URL for immediate fetching, if desired
 * @param options Request options for immediate fetching, if desired
 * @returns Object containing data, error if any, loading state,
 * an initiateFetch function for non-immediate fetching,
 * and a function to update the state for a URL, particularly for
 * emptying out state data once stored
 */
function useFetch<T = unknown>(
  url: string | undefined = undefined,

  // Do not default options to an object or it will trigger dependencies every render.
  // Within an object, the spread operator can be safely used on any value.
  options: RequestInit | undefined = undefined,
) {
  interface State {
    data: T | null;
    error: string | null;
    loading: boolean;
  };

  // Combine as a single state object to ensure synchronous updates
  const [state, setState] = useState<Record<string, State>>({});

  // Track abort controllers by URL
  const controllersMap = useRef(new Map<string, AbortController>());

  /**
   * Sets the (partial) state (date, error, loading) for the specified URL,
   * for only the fields with defined values
   * @param newState The next state to set
   * @param url The fetch URL to update the state for
   */
  const setStateForUrl = useCallback((newState: Partial<State>, url: string) => {
    setState(prev => {
      return {
        ...prev,
        [url]: {
          ...prev[url]!,
          ...newState,
        },
      };
    });
  }, [setState]);

  /**
   * Fetches data from the specified URL, updating the state values accordingly
   * @param url URL to fetch data from
   * @param options Request options for fetching the data
   */
  const initiateFetch = useCallback(async (url: string,
      options: RequestInit | undefined = undefined) => {
    if (!url) {
      return;
    }

    let controller = controllersMap.current.get(url);

    if (controller) {
      controller.abort(new StaleRequestError());
    }

    controller = new AbortController();
    controllersMap.current.set(url, controller);
    setStateForUrl({
      error: null,
      loading: true,
    }, url);

    // For quick manual testing
    // await new Promise((resolve) => setTimeout(resolve, 5000));

    try {
      console.log("Fetching data:", url);
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(response.statusText);
      }

      const responseData: unknown = await response.json();
      console.log("Received data:", responseData);

      if (!responseData || typeof responseData !== 'object') {
        throw new Error('Data received in an unexpected format');
      }

      setStateForUrl({
        data: responseData as T,
        error: null,
        loading: false,
      }, url);
    } catch(e: unknown) {
      let error: string | null = null;

      if (e instanceof Error) {
        if (e.name === StaleRequestError.name) {
          // Don't update state for stale requests
          console.log("Aborting stale request");
          return;
        } else if (e.name === 'AbortError') {
          // If aborted for another reason, let just the loading state be updated appropriately
        } else {
          error = e.message;
        }
      } else {
        // TypeScript and eslint are too restrictive sometimes...
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
        error = String((e as any)?.message ?? e);
        console.error("Error fetching data:", error);
      }

      setStateForUrl({
        data: null,
        error,
        loading: false,
      }, url);
    }
  }, [controllersMap, setStateForUrl]);

  useEffect(() => {
    if (url) {
      void initiateFetch(url, options);
    }

    return () => {
      if (url) {
        // Want to deliberately use the controllersMap that exists at the time of unmounting
        // eslint-disable-next-line react-hooks/exhaustive-deps
        controllersMap.current.get(url)?.abort(new StaleRequestError());
      }
    }
  }, [url, options, initiateFetch]);

  return {state, initiateFetch, setStateForUrl};
}

export default useFetch;
