import type { Dispatch, SetStateAction } from 'react';

/**
 * API contract (v2)
 *
 * - Named exports only (no default exports).
 * - Hooks that wrap a single value return a tuple: `[value, setValue, extras?]`.
 *   `extras` is always a plain object (never a bare function), e.g. `{ inc, dec }`, `{ reset }`.
 * - Setters follow React's `Dispatch<SetStateAction<T>>` whenever the hook accepts arbitrary values.
 * - Collection hooks, and hooks that only navigate a fixed list (`useListState`, `useMapState`, `useSetState`,
 *   `useCycleState`), return `[value, actions]` (there is no free setter to put in the second position).
 * - Two hooks are simpler by nature: `useToggleState` returns `[value, toggle]`, and `useImmutableState`
 *   and `usePreviousState` return just the value.
 * - Lazy initializers (`() => T`) are accepted wherever an initial value is accepted.
 * - Tuples are returned `as const`, so consumers get precise types.
 */

/**
 * A value, or an updater function that derives the next value from the previous one.
 *
 * @typeParam T - Type of the state.
 *
 * @example
 * ```ts
 * setCount(1); // value
 * setCount((previous) => previous + 1); // updater
 * ```
 */
export type Updater<T> = SetStateAction<T>;

/**
 * A value, or a function that lazily returns it (called only once).
 *
 * @typeParam T - Type of the value.
 *
 * @example
 * ```ts
 * useToggleState(true); // value
 * useListState(() => loadItems()); // lazy
 * ```
 */
export type Initializer<T> = T | (() => T);

/**
 * Setter with the same shape as the one returned by `useState`: it accepts a value or an {@link Updater}.
 *
 * @typeParam T - Type of the state.
 */
export type SetState<T> = Dispatch<SetStateAction<T>>;
