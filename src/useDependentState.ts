import { useEffect, useState } from 'react';

export default function useDependentState<T>(setter: (current?: T) => T, deps: any[]) {
  const [state, setState] = useState<T>(setter(undefined));

  useEffect(() => {
    setState((current) => {
      const next = setter(current);

      const curJSON = JSON.stringify(current);
      const nextJSON = JSON.stringify(next);

      return curJSON === nextJSON ? current : next;
    });
  }, deps);

  return [state, setState] as const;
}
