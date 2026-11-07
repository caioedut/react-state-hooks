import { describe, expect, test } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePreviousState } from '../src/usePreviousState';

describe('usePreviousState()', () => {
  test('should be undefined on mount', () => {
    const { result } = renderHook(() => usePreviousState(1));

    expect(result.current).toBeUndefined();
  });

  test('should return the value before the change', () => {
    const { result, rerender } = renderHook(({ value }) => usePreviousState(value), {
      initialProps: { value: 1 },
    });

    rerender({ value: 2 });

    expect(result.current).toBe(1);
  });

  test('should follow every change', () => {
    const { result, rerender } = renderHook(({ value }) => usePreviousState(value), {
      initialProps: { value: 1 },
    });

    rerender({ value: 2 });
    rerender({ value: 3 });
    rerender({ value: 4 });

    expect(result.current).toBe(3);
  });

  test('should keep the previous distinct value when re-rendering with the same value', () => {
    const { result, rerender } = renderHook(({ value }) => usePreviousState(value), {
      initialProps: { value: 1 },
    });

    rerender({ value: 2 });
    rerender({ value: 2 });
    rerender({ value: 2 });

    expect(result.current).toBe(1);
  });

  test('should stay undefined while the value never changes', () => {
    const { result, rerender } = renderHook(({ value }) => usePreviousState(value), {
      initialProps: { value: 1 },
    });

    rerender({ value: 1 });
    rerender({ value: 1 });

    expect(result.current).toBeUndefined();
  });

  test('should be right in the same render in which the value changes', () => {
    const seen: Array<[number, number | undefined]> = [];

    const { rerender } = renderHook(
      ({ value }) => {
        const previous = usePreviousState(value);
        seen.push([value, previous]);
        return previous;
      },
      { initialProps: { value: 1 } },
    );

    rerender({ value: 2 });

    expect(seen[0]).toEqual([1, undefined]);
    // every render after the change already knows the previous value
    expect(seen.slice(1).every(([value, previous]) => value === 2 && previous === 1)).toBe(true);
  });

  test.each([[0], [''], [false], [null]])('should keep the falsy value %p as previous', (falsy) => {
    const { result, rerender } = renderHook(({ value }) => usePreviousState<unknown>(value), {
      initialProps: { value: falsy as unknown },
    });

    rerender({ value: 'next' });

    expect(result.current).toBe(falsy);
  });

  test('should tell undefined apart from a value that never changed', () => {
    const { result, rerender } = renderHook(({ value }) => usePreviousState<number | undefined>(value), {
      initialProps: { value: undefined as number | undefined },
    });

    rerender({ value: 1 });

    expect(result.current).toBeUndefined();

    rerender({ value: 2 });

    expect(result.current).toBe(1);
  });

  test('should compare objects by reference', () => {
    const first = { id: 1 };
    const second = { id: 1 };

    const { result, rerender } = renderHook(({ value }) => usePreviousState(value), {
      initialProps: { value: first },
    });

    rerender({ value: second });

    expect(result.current).toBe(first);
  });

  test('should treat NaN as equal to NaN', () => {
    const { result, rerender } = renderHook(({ value }) => usePreviousState(value), {
      initialProps: { value: Number.NaN },
    });

    rerender({ value: Number.NaN });

    expect(result.current).toBeUndefined();
  });
});
