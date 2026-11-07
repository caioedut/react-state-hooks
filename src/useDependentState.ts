import { useCallback, useState } from 'react';
import type { DependencyList } from 'react';
import type { SetState } from './types';
import { areDepsEqual, resolveUpdater } from './utils';

/**
 * State derived from dependencies: it is recomputed through `factory` whenever a dependency changes,
 * and can still be overridden with the setter in between.
 *
 * @typeParam T - Type of the state.
 * @param factory - Computes the value. Receives the previous value (`undefined` on mount).
 * @param deps - Dependencies, compared with `Object.is`. With none (default), the value is computed only once.
 * @returns A tuple `[value, setValue]`, like `useState`.
 *
 * @remarks
 * - The value is derived during render, so there is never a render with a stale value
 *   and no extra render on mount.
 * - A manual change is discarded when a dependency changes; the factory then receives that manual value.
 * - `setValue` keeps the same identity between renders.
 *
 * @example
 * ```tsx
 * const [filters, setFilters] = useDependentState(() => ({ userId, page: 1 }), [userId]);
 *
 * // Override until `userId` changes
 * setFilters((current) => ({ ...current, page: 2 }));
 * ```
 */
export function useDependentState<T>(factory: (previous: T | undefined) => T, deps: DependencyList = []) {
  const [entry, setEntry] = useState(() => ({ value: factory(undefined), deps }));

  let current = entry;

  if (!areDepsEqual(entry.deps, deps)) {
    current = { value: factory(entry.value), deps };
    setEntry(current);
  }

  const setValue: SetState<T> = useCallback((action) => {
    setEntry((previous) => ({ ...previous, value: resolveUpdater(action, previous.value) }));
  }, []);

  return [current.value, setValue] as const;
}
