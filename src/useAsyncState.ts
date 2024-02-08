import { useCallback, useEffect, useState } from 'react';

export default function useAsyncState<T>(getter: () => Promise<T>) {
  const [state, setState] = useState<T>();
  const [error, setError] = useState<Error>();
  const [isLoading, setIsLoading] = useState(false);

  const setData: typeof setState = (value) => {
    setError(undefined);
    setIsLoading(false);
    setState((current) => {
      return value instanceof Function ? value(current) : value;
    });
  };

  const revalidate = useCallback(async () => {
    setIsLoading(true);
    setError(undefined);

    try {
      const res = await getter();
      setState(res);
    } catch (err) {
      setState(undefined);
      setError(err as Error);
    }

    setIsLoading(false);
  }, []);

  // Reset
  useEffect(() => {
    revalidate();
  }, [revalidate]);

  return [state, setData, { error, isLoading, revalidate }] as const;
}
