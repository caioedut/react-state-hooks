import { useMemo, useState } from 'react';
import type { Initializer } from './types';
import { resolveInitializer } from './utils';

/**
 * `Map` state with immutable helpers to change it.
 *
 * @typeParam K - Type of the keys.
 * @typeParam V - Type of the values.
 * @param initialState - Initial entries (any iterable of `[key, value]`, such as an array or another `Map`),
 * or a function that returns them. Defaults to an empty map.
 * @returns A tuple `[map, actions]`:
 * - `map`: the current entries, as a `ReadonlyMap`. Don't mutate it, use the actions.
 * - `actions.set(key, value)`: adds an entry, or replaces the value of an existing key.
 * - `actions.update(key, updater)`: sets the value of `key` from its previous value
 *   (`undefined` when the key is missing).
 * - `actions.remove(...keys)`: removes entries.
 * - `actions.replace(entries)`: replaces the whole map with the given entries.
 * - `actions.clear()`: empties the map.
 *
 * @remarks
 * - Every change that actually changes something creates a new `Map`. Actions that change nothing
 *   (setting the same value, removing a missing key) keep the same `Map` and don't re-render anything.
 * - The initial iterable is copied, so it is never mutated nor shared.
 * - Keys are compared like `Map` does (`SameValueZero`): objects by reference. Values are compared with `Object.is`.
 * - `actions` keeps the same identity between renders.
 *
 * @example
 * ```tsx
 * const [users, { set, update, remove }] = useMapState<number, { name: string }>();
 *
 * set(1, { name: 'Richard' });
 * update(1, (user) => ({ ...user, name: 'Ward' }));
 * users.get(1); // { name: 'Ward' }
 * remove(1);
 * ```
 */
export function useMapState<K, V>(initialState: Initializer<Iterable<readonly [K, V]>> = []) {
  const [map, setMap] = useState<ReadonlyMap<K, V>>(() => new Map(resolveInitializer(initialState)));

  const actions = useMemo(
    () => ({
      set: (key: K, value: V) => {
        setMap((previous) => {
          if (previous.has(key) && Object.is(previous.get(key), value)) {
            return previous;
          }

          return new Map(previous).set(key, value);
        });
      },

      update: (key: K, updater: (previous: V | undefined) => V) => {
        setMap((previous) => {
          const value = updater(previous.get(key));

          if (previous.has(key) && Object.is(previous.get(key), value)) {
            return previous;
          }

          return new Map(previous).set(key, value);
        });
      },

      remove: (...keys: K[]) => {
        setMap((previous) => {
          if (!keys.some((key) => previous.has(key))) {
            return previous;
          }

          const next = new Map(previous);
          keys.forEach((key) => next.delete(key));
          return next;
        });
      },

      replace: (entries: Iterable<readonly [K, V]>) => {
        setMap(new Map(entries));
      },

      clear: () => {
        setMap((previous) => (previous.size === 0 ? previous : new Map()));
      },
    }),
    [],
  );

  return [map, actions] as const;
}
