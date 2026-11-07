import { useCallback, useSyncExternalStore } from 'react';
import type { Initializer, SetState } from './types';
import { resolveInitializer, resolveUpdater } from './utils';

/** A shared value and the components subscribed to it. */
type StoreEntry = {
  value: unknown;
  listeners: Set<() => void>;
};

/** Every shared value, by key. Lives as long as the module. */
const stores = new Map<string, StoreEntry>();

/** Returns the entry of `key`, creating it with the initial value on first use. */
function getEntry<T>(key: string, initialState?: Initializer<T>): StoreEntry {
  let entry = stores.get(key);

  if (!entry) {
    entry = {
      value: initialState === undefined ? undefined : resolveInitializer(initialState),
      listeners: new Set(),
    };

    stores.set(key, entry);
  }

  return entry;
}

/** Applies a value or updater to the entry of `key` and notifies its listeners when the value changed. */
function setEntryValue<T>(key: string, action: Parameters<SetState<T>>[0]) {
  const entry = getEntry<T>(key);
  const next = resolveUpdater(action, entry.value as T);

  if (!Object.is(next, entry.value)) {
    entry.value = next;
    entry.listeners.forEach((listener) => listener());
  }
}

/**
 * Global state shared by every component that uses the same `key`.
 *
 * Built on `useSyncExternalStore`, so it is safe with concurrent rendering (React 18 or newer).
 *
 * @typeParam T - Type of the state.
 * @param key - Identifies the shared state. Hooks with the same key share the same value.
 * @param initialState - Initial value, or a function that returns it.
 * @returns A tuple `[value, setValue]`, like `useState`.
 *
 * @remarks
 * - The initial state is only used by the first hook that touches a key; later hooks read the current value.
 * - The value lives as long as the module: it is kept after every component unmounts.
 * - `null` is a valid value, and setting the same value (`Object.is`) does not re-render anything.
 * - `setValue` keeps the same identity until `key` changes.
 * - On the server the store is shared by every request, so never keep user specific data in it.
 *
 * @example
 * ```tsx
 * // Anywhere in the app
 * const [theme, setTheme] = useStoreState('theme', 'light');
 *
 * setTheme((current) => (current === 'light' ? 'dark' : 'light'));
 * ```
 *
 * @see https://yoavik.com/snippets/use-global-state
 */
export function useStoreState<T>(key: string, initialState: Initializer<T>): readonly [T, SetState<T>];
/**
 * Same as above, without an initial state: the value starts as `undefined`
 * (unless another hook already set a value for the key).
 * Provide the type explicitly, for example `useStoreState<number>('count')`.
 *
 * @param key - Identifies the shared state.
 */
export function useStoreState<T = undefined>(key: string): readonly [T | undefined, SetState<T | undefined>];
export function useStoreState<T>(key: string, initialState?: Initializer<T>) {
  const subscribe = useCallback(
    (listener: () => void) => {
      const { listeners } = getEntry<T>(key, initialState);
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
    // The initial state only matters on the first call with this key.
    // oxlint-disable-next-line react/exhaustive-deps
    [key],
  );

  const getSnapshot = () => getEntry<T>(key, initialState).value as T;

  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const setState: SetState<T> = useCallback((action) => setEntryValue<T>(key, action), [key]);

  return [state, setState] as const;
}
