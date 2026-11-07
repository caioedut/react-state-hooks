import { useCallback, useState } from 'react';
import type { Initializer } from './types';
import { resolveInitializer } from './utils';

/** A partial object, or a function that derives it from the previous state. */
export type ObjectPatch<T> = Partial<T> | ((previous: T) => Partial<T>);

/**
 * Object state that is updated by merging patches instead of replacing the whole object.
 *
 * @typeParam T - Shape of the state object.
 * @param initialState - Initial object, or a function that returns it. A function runs only once.
 * @returns A tuple `[value, patch, { set, reset }]`:
 * - `value`: the current object.
 * - `patch(partialOrFn)`: shallow-merges a partial object (or the result of a function of the previous state).
 * - `set(value)`: replaces the whole object.
 * - `reset()`: restores the initial object.
 *
 * @remarks
 * - Every update creates a new object; the previous one (including the initial one) is never mutated.
 * - `patch`, `set` and `reset` keep the same identity between renders.
 *
 * @example
 * ```tsx
 * const [user, patch, { set, reset }] = useObjectState({ name: 'Richard', age: 20 });
 *
 * patch({ age: 21 }); // merge
 * patch((current) => ({ age: current.age + 1 })); // merge based on the previous value
 * set({ name: 'Ward', age: 30 }); // replace
 * reset(); // back to the initial object
 * ```
 */
export function useObjectState<T extends object>(initialState: Initializer<T>) {
  const [initial] = useState(() => resolveInitializer(initialState));
  const [state, setState] = useState<T>(initial);

  const patch = useCallback((value: ObjectPatch<T>) => {
    setState((current) => ({ ...current, ...(typeof value === 'function' ? value(current) : value) }));
  }, []);

  const set = useCallback((value: T) => {
    setState(value);
  }, []);

  const reset = useCallback(() => {
    setState(initial);
  }, [initial]);

  return [state, patch, { set, reset }] as const;
}
