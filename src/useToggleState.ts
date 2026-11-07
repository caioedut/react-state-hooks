import { useCallback, useState } from 'react';
import type { Initializer } from './types';

/**
 * Boolean state with a single `toggle` function.
 *
 * @param initialState - Initial value, or a function that returns it. Defaults to `false`.
 * @returns A tuple `[value, toggle]`:
 * - `value`: the current boolean.
 * - `toggle(next?)`: flips the value; when called with a boolean it sets that value instead.
 *
 * @remarks
 * - Any non-boolean argument (such as a click event) is ignored, so `onClick={toggle}` just flips the value.
 * - `toggle` keeps the same identity between renders.
 *
 * @example
 * ```tsx
 * const [isOpen, toggleOpen] = useToggleState(false);
 *
 * toggleOpen(); // flip
 * toggleOpen(true); // set
 *
 * <button onClick={toggleOpen}>{isOpen ? 'Close' : 'Open'}</button>;
 * ```
 */
export function useToggleState(initialState: Initializer<boolean> = false) {
  const [state, setState] = useState(initialState);

  const toggle = useCallback((next?: unknown) => {
    setState((current) => (typeof next === 'boolean' ? next : !current));
  }, []);

  return [state, toggle] as const;
}
