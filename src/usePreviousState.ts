import { useState } from 'react';

/** Internal state: the value being tracked and the one it replaced. */
type PreviousEntry<T> = {
  current: T;
  previous: T | undefined;
};

/**
 * The value that came before the current one.
 *
 * Unlike the usual "value of the previous render" trick, it returns the previous **distinct** value: re-rendering
 * with the same value does not make the previous value become the current one.
 *
 * @typeParam T - Type of the value.
 * @param value - The value to track, such as a prop or a piece of state. Compared with `Object.is`.
 * @returns The value before the last change, or `undefined` while it has never changed.
 *
 * @remarks
 * - It is derived during render, so it is already correct in the same render in which `value` changes.
 * - For state you own and want to go back to, `useHistoryState` also lets you undo and redo.
 *
 * @example
 * ```tsx
 * const previousCount = usePreviousState(count);
 *
 * // count: 0 -> previousCount: undefined
 * // count: 3 -> previousCount: 0
 * // re-render with count: 3 -> previousCount: 0
 * const direction = previousCount === undefined ? 'none' : count > previousCount ? 'up' : 'down';
 * ```
 */
export function usePreviousState<T>(value: T): T | undefined {
  const [entry, setEntry] = useState<PreviousEntry<T>>(() => ({ current: value, previous: undefined }));

  if (!Object.is(entry.current, value)) {
    setEntry({ current: value, previous: entry.current });

    return entry.current;
  }

  return entry.previous;
}
