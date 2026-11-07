import { useCallback, useState } from 'react';
import type { Initializer, SetState } from './types';
import { resolveInitializer, resolveUpdater } from './utils';

/** What `useHistoryState` returns besides the value and its setter. */
export type HistoryExtras<T> = {
  /** Values up to the current one, oldest first. The last item is the current value. */
  history: readonly T[];
  /** Values that were undone and can be redone, the next one first. */
  future: readonly T[];
  /** Goes back `amount` values (default `1`). Never goes before the first value. */
  undo: (amount?: number) => void;
  /** Goes forward `amount` undone values (default `1`). */
  redo: (amount?: number) => void;
  /** `true` when there is a previous value to go back to. */
  canUndo: boolean;
  /** `true` when there is an undone value to go forward to. */
  canRedo: boolean;
};

/** Internal state: the past with the current value, and the future, kept together so they never get out of sync. */
type HistoryEntry<T> = {
  history: readonly T[];
  future: readonly T[];
};

/**
 * State that remembers the last `length` distinct values it had, and can undo and redo them.
 *
 * @typeParam T - Type of the state.
 * @param initialState - Initial value, or a function that returns it.
 * @param length - Maximum number of values kept in the history (at least 1). Defaults to `10`.
 * @returns A tuple `[value, setValue, { history, future, undo, redo, canUndo, canRedo }]`:
 * - `value`: the current value.
 * - `setValue(valueOrUpdater)`: sets the value and adds it to the history. It also discards the values
 *   that could be redone.
 * - `history`: immutable list of values, oldest first; the last item is the current value.
 * - `future`: immutable list of undone values that can be redone, the next one first.
 * - `undo(amount?)`: goes back `amount` values (default `1`).
 * - `redo(amount?)`: goes forward `amount` undone values (default `1`).
 * - `canUndo` and `canRedo`: whether `undo` and `redo` would do something.
 *
 * @remarks
 * - Setting the same value as the current one (compared with `Object.is`) does not add an entry.
 * - `undo` never goes before the first value, and `undo` and `redo` do nothing when there is nowhere to go
 *   or when `amount` is not positive.
 * - `history` and `future` are new arrays on every change; the old ones are never mutated.
 * - `setValue`, `undo` and `redo` keep their identity between renders (`setValue` and `redo` change only with `length`).
 *
 * @example
 * ```tsx
 * const [value, setValue, { history, undo, redo, canUndo, canRedo }] = useHistoryState(0);
 *
 * setValue(2); // value: 2, history: [0, 2]
 * setValue(3); // value: 3, history: [0, 2, 3]
 * undo(); // value: 2, history: [0, 2], future: [3]
 * redo(); // value: 3, history: [0, 2, 3], future: []
 * ```
 */
export function useHistoryState<T>(
  initialState: Initializer<T>,
  length?: number,
): readonly [T, SetState<T>, HistoryExtras<T>];
/**
 * Same as above, without an initial value: the value starts as `undefined` and the history as empty.
 * Provide the type explicitly, for example `useHistoryState<number>()`.
 *
 * @param initialState - Omitted.
 * @param length - Maximum number of values kept in the history. Defaults to `10`.
 */
export function useHistoryState<T = undefined>(
  initialState?: undefined,
  length?: number,
): readonly [T | undefined, SetState<T | undefined>, HistoryExtras<T>];
export function useHistoryState<T>(initialState?: Initializer<T>, length = 10) {
  const limit = Math.max(1, Math.floor(length));

  const [entry, setEntry] = useState<HistoryEntry<T>>(() => ({
    history: initialState === undefined ? [] : [resolveInitializer(initialState)],
    future: [],
  }));

  const value = entry.history[entry.history.length - 1];

  const setState: SetState<T | undefined> = useCallback(
    (action) => {
      setEntry((previous) => {
        const current = previous.history[previous.history.length - 1];
        const next = resolveUpdater(action, current);

        if (previous.history.length > 0 && Object.is(next, current)) {
          return previous;
        }

        return { history: [...previous.history, next as T].slice(-limit), future: [] };
      });
    },
    [limit],
  );

  const undo = useCallback((amount = 1) => {
    setEntry((previous) => {
      const steps = Math.min(Math.floor(amount), previous.history.length - 1);

      if (!(steps > 0)) {
        return previous;
      }

      return {
        history: previous.history.slice(0, -steps),
        future: [...previous.history.slice(-steps), ...previous.future],
      };
    });
  }, []);

  const redo = useCallback(
    (amount = 1) => {
      setEntry((previous) => {
        const steps = Math.min(Math.floor(amount), previous.future.length);

        if (!(steps > 0)) {
          return previous;
        }

        return {
          history: [...previous.history, ...previous.future.slice(0, steps)].slice(-limit),
          future: previous.future.slice(steps),
        };
      });
    },
    [limit],
  );

  return [
    value,
    setState,
    {
      history: entry.history,
      future: entry.future,
      undo,
      redo,
      canUndo: entry.history.length > 1,
      canRedo: entry.future.length > 0,
    },
  ] as const;
}
