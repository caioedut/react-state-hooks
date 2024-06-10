import { DependencyList, useCallback, useEffect, useState } from 'react';

export default function useAsyncState<T>(getter: () => Promise<T>, deps: DependencyList = []) {
  const [state, setState] = useState<T>();
  const [error, setError] = useState<unknown>();
  const [isPending, setIsPending] = useState(true);

  const setData: typeof setState = useCallback((value) => {
    setError(undefined);
    setIsPending(false);
    setState((current) => (value instanceof Function ? value(current) : value));
  }, []);

  const revalidate = useCallback(async () => {
    setIsPending(true);
    setError(undefined);

    try {
      setState(await getter());
    } catch (err) {
      setState(undefined);
      setError(err);
    }

    setIsPending(false);
  }, deps);

  // Reset
  useEffect(() => {
    revalidate();
  }, [revalidate]);

  return [state, setData, { error, isPending, revalidate }] as const;
}
