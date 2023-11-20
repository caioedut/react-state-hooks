import { useCallback, useRef, useState } from 'react';

export default function useHistoryState<T>(initialState?: T, length: number = 10) {
  const historyRef = useRef<T[]>(typeof initialState === 'undefined' ? [] : [initialState]);

  const [state, _setState] = useState<T>(initialState as T);

  const setState: typeof _setState = useCallback(
    (value) => {
      const next = value instanceof Function ? value(state) : value;

      if (next !== historyRef.current.at(-1)) {
        historyRef.current.push(next);

        if (historyRef.current.length > length) {
          const deleteCount = historyRef.current.length - length;
          historyRef.current.splice(0, deleteCount);
        }
      }

      _setState(next);
    },
    [length, state, historyRef],
  );

  const rollback = useCallback(
    (amount = 1) => {
      setState(historyRef.current.at(-(amount + 1)) as T);
    },
    [historyRef, setState],
  );

  return [state, setState, { history: historyRef.current, rollback }] as const;
}
