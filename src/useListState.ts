import { useMemo, useState } from 'react';
import type { Initializer } from './types';

/**
 * List state with immutable helpers to change it.
 *
 * @typeParam T - Type of the items.
 * @param initialState - Initial list, or a function that returns it. Defaults to an empty list.
 * @returns A tuple `[list, actions]`:
 * - `list`: the current items.
 * - `actions.set(items)`: replaces the list with a copy of `items`.
 * - `actions.push(...items)`: adds items to the end.
 * - `actions.insert(index, item)`: inserts an item at `index` (like `Array#splice`, so negative indexes count from the end).
 * - `actions.remove(indexOrHandler)`: removes the item at an index, or every item for which the handler returns `true`.
 * - `actions.update(indexOrHandler, item)`: replaces the item at an index, or every item for which the handler returns `true`.
 * - `actions.filter(predicate)`: keeps only the items that match.
 * - `actions.sort(compareFn?)`: sorts a copy of the list.
 * - `actions.clear()`: empties the list.
 *
 * @remarks
 * - Every action creates a new array; the previous list (including the initial one) is never mutated.
 * - Out of bounds indexes are ignored by `remove` and `update`.
 * - `actions` keeps the same identity between renders.
 *
 * @example
 * ```tsx
 * const [todos, { push, remove, update, sort }] = useListState([{ id: 1, done: false }]);
 *
 * push({ id: 2, done: false });
 * update((todo) => todo.id === 2, { id: 2, done: true });
 * remove((todo) => todo.done);
 * sort((a, b) => a.id - b.id);
 * ```
 */
export function useListState<T>(initialState: Initializer<T[]> = []) {
  const [list, setList] = useState<T[]>(initialState);

  const actions = useMemo(
    () => ({
      set: (items: readonly T[]) => {
        setList([...items]);
      },

      push: (...items: T[]) => {
        setList((prev) => [...prev, ...items]);
      },

      insert: (index: number, item: T) => {
        setList((prev) => {
          const next = [...prev];
          next.splice(index, 0, item);
          return next;
        });
      },

      remove: (indexOrHandler: number | ((item: T, index: number) => boolean)) => {
        setList((prev) => {
          return typeof indexOrHandler === 'function'
            ? prev.filter((item, index) => !indexOrHandler(item, index)) // Removes every match when given a function
            : prev.filter((_, i) => i !== indexOrHandler); // Removes by index
        });
      },

      update: (indexOrHandler: number | ((item: T, index: number) => boolean), newItem: T) => {
        setList((prev) => {
          return typeof indexOrHandler === 'function'
            ? prev.map((item, index) => (indexOrHandler(item, index) ? newItem : item)) // Replaces every match when given a function
            : prev.map((item, index) => (index === indexOrHandler ? newItem : item)); // Replaces by index
        });
      },

      clear: () => {
        setList([]);
      },

      sort: (compareFn?: (a: T, b: T) => number) => {
        // Copies first so the previous list is never mutated (`toSorted` needs ES2023)
        setList((prev) => [...prev].sort(compareFn));
      },

      filter: (predicate: (value: T, index: number, array: T[]) => boolean) => {
        setList((prev) => prev.filter(predicate));
      },
    }),
    [],
  );

  return [list, actions] as const;
}
