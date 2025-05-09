import { useCallback, useEffect, useMemo, useState } from 'react';

const store: { [key: string]: any } = {};

const listeners: { [key: string]: any[] } = {};

/**
 * @reference https://yoavik.com/snippets/use-global-state
 */
export default function useStoreState<T>(key: string, initialState?: T | (() => T)) {
  const [state, _setState] = useState<T>(store[key] ?? initialState);

  const setState: typeof _setState = useCallback(
    (value) => {
      const next = value instanceof Function ? value(store[key]) : value;
      store[key] = next;
      listeners[key].forEach((listener) => listener(next));
    },
    [key],
  );

  // #HACK onBeforeMount
  useMemo(() => {
    // Store the initial state on the first call with this key
    store[key] = store[key] ?? initialState;

    // Create an empty array of listener on the first call with this key
    listeners[key] = listeners[key] ?? [];
  }, [key]);

  useEffect(() => {
    // Register the observer
    const listener: typeof _setState = (state) => _setState(state);
    listeners[key].push(listener);

    // Cleanup when unmounting
    return () => {
      const index = listeners[key].indexOf(listener);
      if (index > -1) {
        listeners[key].splice(index, 1);
      }
    };
  }, [key]);

  return [state, setState] as const;
}
