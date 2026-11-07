import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * State that walks through a fixed list of values, going back to the first one after the last.
 *
 * Good for things like a theme (`'light'`, `'dark'`, `'system'`), a sort order (`'none'`, `'asc'`, `'desc'`)
 * or a view mode (`'list'`, `'grid'`).
 *
 * @typeParam T - Type of the values.
 * @param values - The values to cycle through. It must have at least one value. To get a union of literal types,
 * write it `as const` or pass the type, for example `useCycleState<'light' | 'dark'>(['light', 'dark'])`.
 * @param initialValue - The value to start with. Defaults to the first one, and so does a value that is not in the list.
 * @returns A tuple `[value, { next, prev, set, index }]`:
 * - `value`: the current value.
 * - `actions.next()`: goes to the next value, or to the first one after the last.
 * - `actions.prev()`: goes to the previous value, or to the last one before the first.
 * - `actions.set(value)`: goes to the given value. A value that is not in the list is ignored.
 * - `actions.index`: the position of the current value in the list.
 *
 * @remarks
 * - `next` takes no arguments, so `onClick={next}` is safe: the event is ignored.
 * - The hook keeps the **position**, not the value. If the list changes, the same position is used
 *   (wrapping around if the list got shorter), so an inline array on every render works.
 * - Values are compared with `Object.is`.
 * - `next`, `prev` and `set` keep the same identity between renders.
 *
 * @example
 * ```tsx
 * const [theme, { next, set }] = useCycleState(['light', 'dark', 'system'] as const);
 *
 * <button onClick={next}>Theme: {theme}</button>; // light -> dark -> system -> light
 * set('dark');
 * ```
 */
export function useCycleState<T>(values: readonly [T, ...T[]], initialValue?: T) {
  const valuesRef = useRef(values);

  const [index, setIndex] = useState(() => {
    const found = initialValue === undefined ? -1 : values.findIndex((value) => Object.is(value, initialValue));
    return found === -1 ? 0 : found;
  });

  useEffect(() => {
    valuesRef.current = values;
  });

  const next = useCallback(() => {
    setIndex((current) => (current + 1) % valuesRef.current.length);
  }, []);

  const prev = useCallback(() => {
    setIndex((current) => (current - 1 + valuesRef.current.length) % valuesRef.current.length);
  }, []);

  const set = useCallback((value: T) => {
    const found = valuesRef.current.findIndex((item) => Object.is(item, value));

    if (found !== -1) {
      setIndex(found);
    }
  }, []);

  const position = index % values.length;

  return [values[position] as T, { next, prev, set, index: position }] as const;
}
