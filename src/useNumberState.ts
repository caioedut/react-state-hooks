import { useCallback, useState } from 'react';

export type NumberStateOptions = {
  min?: number;
  max?: number;
  step?: number;
};

export default function useNumberState(initialState?: number, options: NumberStateOptions = {}) {
  const resolveValue = useCallback(
    (value?: number) => {
      if (typeof value === 'number') {
        if (typeof options.min === 'number') {
          value = Math.max(options.min, value);
        }

        if (typeof options.max === 'number') {
          value = Math.min(options.max, value);
        }

        if (typeof options.step === 'number') {
          value = Math.floor(value / options.step) * options.step;
        }
      }

      return value;
    },
    [options],
  );

  const [state, _setSetate] = useState(resolveValue(initialState));

  const setState = useCallback(
    (value: number | ((current?: number) => number)) => {
      _setSetate(value instanceof Function ? value(state) : value);
    },
    [state],
  );

  const inc = useCallback(
    (value = options.step ?? 1) => {
      setState((current) => (current ?? 0) + value);
    },
    [setState, options.step],
  );

  const dec = useCallback(
    (value = options.step ?? 1) => {
      setState((current) => (current ?? 0) - value);
    },
    [setState, options.step],
  );

  return [state, setState, { inc, dec }] as const;
}
