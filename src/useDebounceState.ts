import { useCallback, useEffect, useRef, useState } from 'react';
import type { Initializer, SetState, Updater } from './types';

/**
 * State whose updates are applied only after `delay` milliseconds without new calls to the setter.
 *
 * @typeParam T - Type of the state.
 * @param initialValue - Initial value, or a function that returns it.
 * @param delay - Milliseconds to wait. Defaults to `500`.
 * @returns A tuple `[value, setValue, { cancel, flush, isPending }]`:
 * - `value`: the debounced value.
 * - `setValue(valueOrUpdater)`: schedules an update; it works like the setter of `useState`.
 * - `cancel()`: drops the pending update.
 * - `flush()`: applies the pending update immediately.
 * - `isPending`: `true` while an update waits for the delay.
 *
 * @remarks
 * - When called several times within the delay, only the last call is applied
 *   (an updater function receives the value that is current when the timer fires).
 * - The `delay` of the render in which the setter is called is the one used.
 * - The timer is cleared on unmount, and `setValue`, `cancel` and `flush` keep the same identity between renders.
 *
 * @example
 * ```tsx
 * const [query, setQuery, { flush, isPending }] = useDebounceState('', 300);
 *
 * <input onChange={(e) => setQuery(e.target.value)} onBlur={flush} />;
 * {isPending && <Spinner />}
 * ```
 */
export function useDebounceState<T>(initialValue: Initializer<T>, delay = 500) {
  const [state, setStateImmediate] = useState<T>(initialValue);
  const [isPending, setIsPending] = useState(false);

  const delayRef = useRef(delay);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const pendingRef = useRef<{ action: Updater<T> } | undefined>(undefined);

  useEffect(() => {
    delayRef.current = delay;
  }, [delay]);

  const clearTimer = useCallback(() => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = undefined;
  }, []);

  const flush = useCallback(() => {
    clearTimer();

    const pending = pendingRef.current;
    pendingRef.current = undefined;

    if (pending) {
      setStateImmediate(pending.action);
      setIsPending(false);
    }
  }, [clearTimer]);

  const cancel = useCallback(() => {
    clearTimer();
    pendingRef.current = undefined;
    setIsPending(false);
  }, [clearTimer]);

  const setState: SetState<T> = useCallback(
    (action) => {
      clearTimer();
      pendingRef.current = { action };
      setIsPending(true);
      timeoutRef.current = setTimeout(flush, delayRef.current);
    },
    [clearTimer, flush],
  );

  // Never fire after unmount
  useEffect(() => clearTimer, [clearTimer]);

  return [state, setState, { cancel, flush, isPending }] as const;
}
