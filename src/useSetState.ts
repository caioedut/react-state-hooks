import { useMemo, useState } from 'react';
import type { Initializer } from './types';
import { resolveInitializer } from './utils';

/**
 * `Set` state with immutable helpers to change it.
 *
 * @typeParam T - Type of the items.
 * @param initialState - Initial items (any iterable, such as an array or another `Set`), or a function that
 * returns them. Defaults to an empty set.
 * @returns A tuple `[set, actions]`:
 * - `set`: the current items, as a `ReadonlySet`. Don't mutate it, use the actions.
 * - `actions.add(...items)`: adds items.
 * - `actions.remove(...items)`: removes items.
 * - `actions.toggle(item, force?)`: adds the item when it is missing and removes it when it is there.
 *   With `force`, `true` adds it and `false` removes it.
 * - `actions.replace(items)`: replaces the whole set with the given items.
 * - `actions.clear()`: empties the set.
 *
 * @remarks
 * - Every change that actually changes something creates a new `Set`. Actions that change nothing
 *   (adding an item that is already there, removing one that is not) keep the same `Set`
 *   and don't re-render anything.
 * - The initial iterable is copied, so it is never mutated nor shared.
 * - Items are compared like `Set` does (`SameValueZero`): objects by reference.
 * - `actions` keeps the same identity between renders.
 *
 * @example
 * ```tsx
 * const [selected, { toggle, add, remove, clear }] = useSetState<number>();
 *
 * toggle(1); // selected: Set { 1 }
 * add(2, 3); // selected: Set { 1, 2, 3 }
 * remove(1); // selected: Set { 2, 3 }
 * selected.has(2); // true
 * clear();
 * ```
 */
export function useSetState<T>(initialState: Initializer<Iterable<T>> = []) {
  const [set, setSet] = useState<ReadonlySet<T>>(() => new Set(resolveInitializer(initialState)));

  const actions = useMemo(
    () => ({
      add: (...items: T[]) => {
        setSet((previous) => {
          if (items.every((item) => previous.has(item))) {
            return previous;
          }

          return new Set([...previous, ...items]);
        });
      },

      remove: (...items: T[]) => {
        setSet((previous) => {
          if (!items.some((item) => previous.has(item))) {
            return previous;
          }

          const next = new Set(previous);
          items.forEach((item) => next.delete(item));
          return next;
        });
      },

      toggle: (item: T, force?: boolean) => {
        setSet((previous) => {
          const has = previous.has(item);

          if ((force ?? !has) === has) {
            return previous;
          }

          const next = new Set(previous);

          if (has) {
            next.delete(item);
          } else {
            next.add(item);
          }

          return next;
        });
      },

      replace: (items: Iterable<T>) => {
        setSet(new Set(items));
      },

      clear: () => {
        setSet((previous) => (previous.size === 0 ? previous : new Set()));
      },
    }),
    [],
  );

  return [set, actions] as const;
}
