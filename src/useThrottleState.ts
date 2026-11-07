import { useCallback, useEffect, useRef, useState } from 'react';
import type { Initializer, SetState, Updater } from './types';

/** When, inside each interval, an update is applied. */
export type ThrottleOptions = {
  /** Apply the first update of an interval right away. Defaults to `true`. */
  leading?: boolean | undefined;
  /** Apply the last update received during an interval when it ends. Defaults to `true`. */
  trailing?: boolean | undefined;
};

/**
 * State whose updates are applied at most once every `interval` milliseconds.
 *
 * Unlike a debounce, which waits for the calls to stop, a throttle keeps applying updates
 * while the calls continue (for example while scrolling or dragging).
 *
 * @typeParam T - Type of the state.
 * @param initialValue - Initial value, or a function that returns it.
 * @param interval - Minimum milliseconds between two applied updates. Defaults to `500`.
 * @param options - {@link ThrottleOptions | Leading and trailing behavior}. Both default to `true`.
 * @returns A tuple `[value, setValue, { cancel, flush, isPending }]`:
 * - `value`: the throttled value.
 * - `setValue(valueOrUpdater)`: requests an update; it works like the setter of `useState`.
 * - `cancel()`: drops the pending update and ends the interval.
 * - `flush()`: applies the pending update immediately and ends the interval.
 * - `isPending`: `true` while an update waits for the end of the interval.
 *
 * @remarks
 * - With the defaults, the first call applies right away (leading) and starts an interval. Calls made during
 *   the interval are held, only the last one is kept, and it is applied when the interval ends (trailing),
 *   which starts a new interval. With `leading: false` nothing is applied before the interval ends,
 *   and with `trailing: false` the calls held during an interval are dropped.
 * - An updater function receives the value that is current when it is applied.
 * - The `interval` and the options of the render in which the setter is called are the ones used.
 * - The timer is cleared on unmount, and `setValue`, `cancel` and `flush` keep the same identity between renders.
 *
 * @example
 * ```tsx
 * const [scrollY, setScrollY, { isPending }] = useThrottleState(0, 100);
 *
 * // `scrollY` follows the scroll, but changes at most every 100ms
 * <ScrollView onScroll={(e) => setScrollY(e.nativeEvent.contentOffset.y)} />;
 * ```
 */
export function useThrottleState<T>(initialValue: Initializer<T>, interval = 500, options: ThrottleOptions = {}) {
  const { leading = true, trailing = true } = options;

  const [state, setStateImmediate] = useState<T>(initialValue);
  const [isPending, setIsPending] = useState(false);

  const intervalRef = useRef(interval);
  const leadingRef = useRef(leading);
  const trailingRef = useRef(trailing);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const pendingRef = useRef<{ action: Updater<T> } | undefined>(undefined);

  useEffect(() => {
    intervalRef.current = interval;
    leadingRef.current = leading;
    trailingRef.current = trailing;
  }, [interval, leading, trailing]);

  const clearTimer = useCallback(() => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = undefined;
  }, []);

  // Called when an interval ends: applies what was held and, if so, starts another interval
  const endInterval = useCallback(function end() {
    timeoutRef.current = undefined;

    const pending = pendingRef.current;
    pendingRef.current = undefined;

    if (pending) {
      setStateImmediate(pending.action);
      setIsPending(false);
      timeoutRef.current = setTimeout(end, intervalRef.current);
    }
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
      const isIdle = timeoutRef.current === undefined;

      if (isIdle && leadingRef.current) {
        setStateImmediate(action);
      } else if (trailingRef.current) {
        pendingRef.current = { action };
        setIsPending(true);
      }

      if (isIdle) {
        timeoutRef.current = setTimeout(endInterval, intervalRef.current);
      }
    },
    [endInterval],
  );

  // Never fire after unmount
  useEffect(() => clearTimer, [clearTimer]);

  return [state, setState, { cancel, flush, isPending }] as const;
}
