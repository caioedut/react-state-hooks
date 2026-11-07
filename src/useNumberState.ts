import { useCallback, useState } from 'react';
import type { SetState } from './types';
import { countDecimals, resolveUpdater } from './utils';

/** Rules applied to every value of `useNumberState`. */
export type NumberStateOptions = {
  /** Smallest allowed value. */
  min?: number | undefined;
  /** Largest allowed value. */
  max?: number | undefined;
  /** Values are floored to a multiple of `step`, counting from `min` (or from 0). Ignored when not positive. */
  step?: number | undefined;
};

/**
 * Applies the rules in this order: clamp to `[min, max]`, then floor to the nearest multiple of `step`
 * (counting from `min`, or from 0 when there is no `min`).
 */
function normalize(value: number, { min, max, step }: NumberStateOptions) {
  if (typeof min === 'number') {
    value = Math.max(min, value);
  }

  if (typeof max === 'number') {
    value = Math.min(max, value);
  }

  if (typeof step === 'number' && step > 0) {
    const base = min ?? 0;
    const decimals = Math.max(countDecimals(step), countDecimals(base));

    value = Number((base + Math.floor((value - base) / step + 1e-9) * step).toFixed(decimals));
  }

  return value;
}

/**
 * Numeric state with optional `min`, `max` and `step` rules.
 *
 * @param initialState - Initial value. Defaults to `0`. The rules are applied to it as well.
 * @param options - {@link NumberStateOptions | Rules} applied to every new value.
 * @returns A tuple `[value, setValue, { inc, dec }]`:
 * - `value`: the current number (always a `number`).
 * - `setValue(valueOrUpdater)`: sets the value; the rules are applied to the result.
 * - `inc(amount?)`: adds `amount`. Defaults to `step`, or `1` when there is no step.
 * - `dec(amount?)`: subtracts `amount`. Defaults to `step`, or `1` when there is no step.
 *
 * @remarks
 * - Rules run in order: clamp to `[min, max]`, then floor to a multiple of `step` (counted from `min`).
 * - Floating point steps (such as `0.1`) don't accumulate errors.
 * - `setValue`, `inc` and `dec` keep their identity until `min`, `max` or `step` change,
 *   so passing the options inline is fine.
 *
 * @example
 * ```tsx
 * const [quantity, setQuantity, { inc, dec }] = useNumberState(1, { min: 1, max: 10 });
 *
 * inc(); // 2
 * dec(5); // 1 (clamped to min)
 * setQuantity(100); // 10 (clamped to max)
 * ```
 */
export function useNumberState(initialState = 0, { min, max, step }: NumberStateOptions = {}) {
  const [state, setStateRaw] = useState(() => normalize(initialState, { min, max, step }));

  const setState: SetState<number> = useCallback(
    (action) => {
      setStateRaw((current) => normalize(resolveUpdater(action, current), { min, max, step }));
    },
    [min, max, step],
  );

  const inc = useCallback(
    (amount = step ?? 1) => {
      setState((current) => current + amount);
    },
    [setState, step],
  );

  const dec = useCallback(
    (amount = step ?? 1) => {
      setState((current) => current - amount);
    },
    [setState, step],
  );

  return [state, setState, { inc, dec }] as const;
}
