import { useCallback, useState } from 'react';

export default function useObjectState<T>(initialState?: T) {
  const [state, setState] = useState<T>(Object(initialState));

  const updateState = useCallback((value: Partial<T>) => {
    setState((current) => ({ ...current, ...value }));
  }, []);

  const resetState = useCallback((newValue?: T) => {
    setState(Object(newValue));
  }, []);

  return [state, updateState, resetState] as const;
}
