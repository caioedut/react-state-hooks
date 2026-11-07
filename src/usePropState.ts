import { useCallback, useState } from 'react';
import type { Initializer, SetState } from './types';
import { resolveInitializer, resolveUpdater } from './utils';

/**
 * Local state that follows a prop: it can be changed locally, but is replaced again
 * whenever the prop changes to a defined value.
 *
 * @typeParam T - Type of the state.
 * @param prop - The prop to follow. While it is `undefined`, the state is left as it is.
 * @param initialState - Value (or function that returns it) used when `prop` is `undefined` on mount.
 * @returns A tuple `[value, setValue]`, like `useState`.
 *
 * @remarks
 * - The sync happens during render, so there is never a render with a stale value.
 * - The prop is compared with `Object.is`; a local change is kept while the prop stays the same.
 * - `setValue` keeps the same identity between renders.
 *
 * @example
 * ```tsx
 * function NameField({ name }: { name?: string }) {
 *   const [value, setValue] = usePropState(name, 'Richard');
 *
 *   return <input value={value} onChange={(e) => setValue(e.target.value)} />;
 * }
 * ```
 */
export function usePropState<T>(prop: T | undefined, initialState: Initializer<T>): readonly [T, SetState<T>];
/**
 * Same as above, without an initial state: the type of the state is the type of the prop.
 *
 * @param prop - The prop to follow.
 */
export function usePropState<T>(prop: T): readonly [T, SetState<T>];
export function usePropState<T>(prop: T | undefined, initialState?: Initializer<T>) {
  const [entry, setEntry] = useState(() => ({
    value: prop !== undefined ? prop : initialState === undefined ? undefined : resolveInitializer(initialState),
    prop,
  }));

  let current = entry;

  if (!Object.is(entry.prop, prop)) {
    current = { value: prop !== undefined ? prop : entry.value, prop };
    setEntry(current);
  }

  const setState: SetState<T | undefined> = useCallback((action) => {
    setEntry((previous) => ({ ...previous, value: resolveUpdater(action, previous.value) }));
  }, []);

  return [current.value, setState] as const;
}
