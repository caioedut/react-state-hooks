import { useCallback, useRef, useState } from 'react';

export default function useDebounceState<T>(initialValue: T, delay = 500) {
  const [state, _setState] = useState(initialValue);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setState: typeof _setState = useCallback(
    (value) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        _setState(value);
      }, delay);
    },
    [delay],
  );

  return [state, setState] as const;
}
