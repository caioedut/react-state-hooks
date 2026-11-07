import { describe, expect, test } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useCycleState } from '../src/useCycleState';

const themes = ['light', 'dark', 'system'] as const;

describe('useCycleState()', () => {
  describe('initial value', () => {
    test('should start with the first value', () => {
      const { result } = renderHook(() => useCycleState(themes));

      expect(result.current[0]).toBe('light');
      expect(result.current[1].index).toBe(0);
    });

    test('should start with the given value', () => {
      const { result } = renderHook(() => useCycleState(themes, 'dark'));

      expect(result.current[0]).toBe('dark');
      expect(result.current[1].index).toBe(1);
    });

    test('should start with the first value when the given one is not in the list', () => {
      const { result } = renderHook(() => useCycleState<string>(themes, 'other'));

      expect(result.current[0]).toBe('light');
    });

    test('should ignore a changed initial value after mount', () => {
      const { result, rerender } = renderHook(({ initial }) => useCycleState(themes, initial), {
        initialProps: { initial: 'dark' as (typeof themes)[number] },
      });

      rerender({ initial: 'system' });

      expect(result.current[0]).toBe('dark');
    });

    test('should work with a list of one value', () => {
      const { result } = renderHook(() => useCycleState(['only']));

      act(() => result.current[1].next());
      expect(result.current[0]).toBe('only');

      act(() => result.current[1].prev());
      expect(result.current[0]).toBe('only');
    });

    test('should work with values that are not strings', () => {
      const first = { id: 1 };
      const second = { id: 2 };
      const { result } = renderHook(() => useCycleState([first, second], second));

      expect(result.current[0]).toBe(second);
    });
  });

  describe('next()', () => {
    test('should go to the next value', () => {
      const { result } = renderHook(() => useCycleState(themes));

      act(() => result.current[1].next());

      expect(result.current[0]).toBe('dark');
      expect(result.current[1].index).toBe(1);
    });

    test('should go back to the first value after the last one', () => {
      const { result } = renderHook(() => useCycleState(themes, 'system'));

      act(() => result.current[1].next());

      expect(result.current[0]).toBe('light');
    });

    test('should walk through the whole list in order', () => {
      const { result } = renderHook(() => useCycleState(themes));
      const seen: string[] = [result.current[0]];

      for (let step = 0; step < 4; step++) {
        act(() => result.current[1].next());
        seen.push(result.current[0]);
      }

      expect(seen).toEqual(['light', 'dark', 'system', 'light', 'dark']);
    });

    test('should move once per call inside the same batch', () => {
      const { result } = renderHook(() => useCycleState(themes));

      act(() => {
        result.current[1].next();
        result.current[1].next();
      });

      expect(result.current[0]).toBe('system');
    });

    test('should ignore any argument, such as a click event', () => {
      const { result } = renderHook(() => useCycleState(themes));
      const next = result.current[1].next as (event?: unknown) => void;

      act(() => next({ type: 'click' }));

      expect(result.current[0]).toBe('dark');
    });
  });

  describe('prev()', () => {
    test('should go to the previous value', () => {
      const { result } = renderHook(() => useCycleState(themes, 'system'));

      act(() => result.current[1].prev());

      expect(result.current[0]).toBe('dark');
    });

    test('should go to the last value before the first one', () => {
      const { result } = renderHook(() => useCycleState(themes));

      act(() => result.current[1].prev());

      expect(result.current[0]).toBe('system');
    });

    test('should undo a next()', () => {
      const { result } = renderHook(() => useCycleState(themes));

      act(() => result.current[1].next());
      act(() => result.current[1].prev());

      expect(result.current[0]).toBe('light');
    });
  });

  describe('set()', () => {
    test('should go to the given value', () => {
      const { result } = renderHook(() => useCycleState(themes));

      act(() => result.current[1].set('system'));

      expect(result.current[0]).toBe('system');
      expect(result.current[1].index).toBe(2);
    });

    test('should ignore a value that is not in the list', () => {
      const { result } = renderHook(() => useCycleState<string>(themes));

      act(() => result.current[1].set('other'));

      expect(result.current[0]).toBe('light');
    });

    test('should find NaN, since values are compared with Object.is', () => {
      const { result } = renderHook(() => useCycleState([1, Number.NaN, 3]));

      act(() => result.current[1].set(Number.NaN));

      expect(result.current[1].index).toBe(1);
    });

    test('should keep cycling from the new position', () => {
      const { result } = renderHook(() => useCycleState(themes));

      act(() => result.current[1].set('dark'));
      act(() => result.current[1].next());

      expect(result.current[0]).toBe('system');
    });
  });

  describe('changing list', () => {
    test('should work when a new array is passed on every render', () => {
      const { result } = renderHook(() => useCycleState(['a', 'b', 'c']));

      act(() => result.current[1].next());
      act(() => result.current[1].next());

      expect(result.current[0]).toBe('c');
    });

    test('should keep the position when the list changes', () => {
      const { result, rerender } = renderHook(({ values }) => useCycleState(values), {
        initialProps: { values: ['a', 'b', 'c'] as [string, ...string[]] },
      });

      act(() => result.current[1].next());
      rerender({ values: ['x', 'y', 'z'] });

      expect(result.current[0]).toBe('y');
    });

    test('should wrap around when the list gets shorter than the position', () => {
      const { result, rerender } = renderHook(({ values }) => useCycleState(values, 'c'), {
        initialProps: { values: ['a', 'b', 'c'] as [string, ...string[]] },
      });

      rerender({ values: ['x', 'y'] });

      expect(result.current[1].index).toBe(0);
      expect(result.current[0]).toBe('x');
    });

    test('should use the latest list when moving', () => {
      const { result, rerender } = renderHook(({ values }) => useCycleState(values), {
        initialProps: { values: ['a', 'b'] as [string, ...string[]] },
      });

      rerender({ values: ['a', 'b', 'c'] });
      act(() => result.current[1].next());
      act(() => result.current[1].next());

      expect(result.current[0]).toBe('c');
    });

    test('should use the latest list when setting a value', () => {
      const { result, rerender } = renderHook(({ values }) => useCycleState<string>(values), {
        initialProps: { values: ['a', 'b'] as [string, ...string[]] },
      });

      rerender({ values: ['a', 'b', 'c'] });
      act(() => result.current[1].set('c'));

      expect(result.current[0]).toBe('c');
    });
  });

  describe('identity', () => {
    test('next, prev and set should be stable between renders', () => {
      const { result, rerender } = renderHook(() => useCycleState(['a', 'b']));
      const { next, prev, set } = result.current[1];

      act(() => next());
      rerender();

      expect(result.current[1].next).toBe(next);
      expect(result.current[1].prev).toBe(prev);
      expect(result.current[1].set).toBe(set);
    });
  });
});
