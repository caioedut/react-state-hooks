import { useCallback, useEffect, useState } from 'react';

export default function useAsyncState<T>(getter: () => Promise<T>) {
  const [state, setState] = useState<T>();
  const [error, setError] = useState<Error>();
  const [isLoading, setIsLoading] = useState(false);

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
  }, [getter]);

  // Reset
  useEffect(() => {
    revalidate();
  }, [getter]);

  return { data: state, error, isLoading, revalidate };
}
