import { useCallback, useEffect, useRef, useState } from 'react';
import type { DependencyList } from 'react';
import type { SetState } from './types';
import { createAbortController, resolveUpdater } from './utils';

/**
 * Loads a value asynchronously, on mount and again whenever `deps` change.
 *
 * @typeParam T - Type of the loaded value.
 * @param getter - Returns a promise with the value. Receives an `AbortSignal`.
 * @param deps - Dependencies that trigger a new run when they change. Defaults to none (runs once).
 * @returns A tuple `[data, setData, { error, isPending, revalidate }]`:
 * - `data`: the loaded value, or `undefined` while loading, after an error, or before any run finishes.
 * - `setData(valueOrUpdater)`: overrides the data manually and discards any run still in flight.
 * - `error`: the rejection of the last run, or `undefined`.
 * - `isPending`: `true` while a run is in flight (starts as `true`).
 * - `revalidate()`: runs the getter again.
 *
 * @remarks
 * - Only the latest run can update the state, so a slow old response never overwrites a newer one.
 * - The `AbortSignal` is aborted when a run becomes outdated (new run, deps change or unmount).
 *   Pass it to `fetch` to cancel the request. It works in browsers, Node and React Native, and a minimal
 *   signal is used when the platform has no `AbortController`, so the hook never throws because of it.
 * - On error the data is cleared and `error` is set; a later successful run clears the error.
 * - `revalidate` always calls the latest getter and keeps the same identity between renders.
 *
 * @example
 * ```tsx
 * const [user, setUser, { error, isPending, revalidate }] = useAsyncState(
 *   (signal) => fetch(`/users/${userId}`, { signal }).then((res) => res.json()),
 *   [userId],
 * );
 * ```
 */
export function useAsyncState<T>(getter: (signal: AbortSignal) => Promise<T>, deps: DependencyList = []) {
  const [state, setState] = useState<T>();
  const [error, setError] = useState<unknown>();
  const [isPending, setIsPending] = useState(true);

  const getterRef = useRef(getter);
  const runRef = useRef(0);
  const controllerRef = useRef<ReturnType<typeof createAbortController> | undefined>(undefined);

  useEffect(() => {
    getterRef.current = getter;
  });

  const invalidate = useCallback(() => {
    runRef.current += 1;
    controllerRef.current?.abort();
    controllerRef.current = undefined;
  }, []);

  const setData: SetState<T | undefined> = useCallback(
    (value) => {
      invalidate();
      setError(undefined);
      setIsPending(false);
      setState((current) => resolveUpdater(value, current));
    },
    [invalidate],
  );

  const revalidate = useCallback(async () => {
    invalidate();

    const run = runRef.current;
    const controller = createAbortController();
    controllerRef.current = controller;

    setIsPending(true);
    setError(undefined);

    try {
      const value = await getterRef.current(controller.signal);

      if (run === runRef.current) {
        setState(() => value);
        setIsPending(false);
      }
    } catch (err) {
      if (run === runRef.current) {
        setState(undefined);
        setError(err);
        setIsPending(false);
      }
    }
  }, [invalidate]);

  useEffect(() => {
    void revalidate();

    return invalidate;
    // `deps` is user provided, so it can't be verified statically.
    // oxlint-disable-next-line react/exhaustive-deps
  }, [revalidate, ...deps]);

  return [state, setData, { error, isPending, revalidate }] as const;
}
