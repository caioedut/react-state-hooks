import { describe, expect, test, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useDependentState } from '../src/useDependentState';

type FuncState = () => string;

const fnA: FuncState = () => 'A';
const fnB: FuncState = () => 'B';
const fnC: FuncState = () => 'C';

describe('useDependentState()', () => {
  describe('initial value', () => {
    test('should start with the value returned by the factory', () => {
      const { result } = renderHook(({ dep }) => useDependentState(() => dep, [dep]), {
        initialProps: { dep: 'any value' },
      });

      expect(result.current[0]).toBe('any value');
    });

    test('should call the factory with undefined on mount', () => {
      const factory = vi.fn(() => 1);

      renderHook(() => useDependentState(factory, []));

      expect(factory).toHaveBeenCalledTimes(1);
      expect(factory).toHaveBeenCalledWith(undefined);
    });

    test('should not call the factory again on re-renders when the deps are the same', () => {
      const factory = vi.fn(() => 1);
      const { rerender } = renderHook(() => useDependentState(factory, ['a']));

      rerender();
      rerender();

      expect(factory).toHaveBeenCalledTimes(1);
    });

    test('should not render more than once on mount', () => {
      let renders = 0;

      renderHook(() => {
        renders++;
        return useDependentState(() => 'value', []);
      });

      expect(renders).toBe(1);
    });

    test('should default to no dependencies, so the value is never recomputed', () => {
      const factory = vi.fn(() => 1);
      const { rerender } = renderHook(() => useDependentState(factory));

      rerender();

      expect(factory).toHaveBeenCalledTimes(1);
    });
  });

  describe('setState()', () => {
    test('should update the state value', () => {
      const { result } = renderHook(({ dep }) => useDependentState(() => dep, [dep]), {
        initialProps: { dep: 'any value' },
      });

      act(() => result.current[1]('new value'));

      expect(result.current[0]).toBe('new value');
    });

    test('should accept an updater that receives the current value', () => {
      const { result } = renderHook(() => useDependentState(() => 1, []));

      act(() => result.current[1]((prev) => prev + 1));

      expect(result.current[0]).toBe(2);
    });

    test('should apply updaters sequentially inside the same batch', () => {
      const { result } = renderHook(() => useDependentState(() => 0, []));

      act(() => {
        result.current[1]((prev) => prev + 1);
        result.current[1]((prev) => prev + 1);
      });

      expect(result.current[0]).toBe(2);
    });

    test('should keep its identity between renders and dependency changes', () => {
      const { result, rerender } = renderHook(({ dep }) => useDependentState(() => dep, [dep]), {
        initialProps: { dep: 1 },
      });
      const setState = result.current[1];

      rerender({ dep: 2 });

      expect(result.current[1]).toBe(setState);
    });
  });

  describe('dependencies', () => {
    test('should recompute the value when a dependency changes', () => {
      const { result, rerender } = renderHook(({ dep }) => useDependentState(() => dep, [dep]), {
        initialProps: { dep: 'any value' },
      });

      rerender({ dep: 'other value' });

      expect(result.current[0]).toBe('other value');
    });

    test('should never render a stale value after a dependency change', () => {
      const seen: number[] = [];

      const { rerender } = renderHook(
        ({ dep }) => {
          const [value] = useDependentState(() => dep, [dep]);
          seen.push(value);
          return value;
        },
        { initialProps: { dep: 1 } },
      );

      rerender({ dep: 2 });

      expect(seen[0]).toBe(1);
      expect(seen.slice(1).every((value) => value === 2)).toBe(true);
    });

    test('should discard a manual change when a dependency changes', () => {
      const { result, rerender } = renderHook(({ dep }) => useDependentState(() => dep, [dep]), {
        initialProps: { dep: 'a' },
      });

      act(() => result.current[1]('manual'));
      rerender({ dep: 'b' });

      expect(result.current[0]).toBe('b');
    });

    test('should keep a manual change while the dependencies stay the same', () => {
      const { result, rerender } = renderHook(({ dep }) => useDependentState(() => dep, [dep]), {
        initialProps: { dep: 'a' },
      });

      act(() => result.current[1]('manual'));
      rerender({ dep: 'a' });

      expect(result.current[0]).toBe('manual');
    });

    test('should give the factory the previous state when the dependencies change', () => {
      const factory = vi.fn((current?: number) => (current ?? 0) + 1);

      const { result, rerender } = renderHook(({ dep }) => useDependentState(factory, [dep]), {
        initialProps: { dep: 1 },
      });

      expect(result.current[0]).toBe(1);
      expect(factory).toHaveBeenLastCalledWith(undefined);

      rerender({ dep: 2 });

      expect(result.current[0]).toBe(2);
      expect(factory).toHaveBeenLastCalledWith(1);
    });

    test('should give the factory the manually set value as the previous state', () => {
      const factory = vi.fn((current?: string) => `${current ?? 'none'}!`);

      const { result, rerender } = renderHook(({ dep }) => useDependentState(factory, [dep]), {
        initialProps: { dep: 1 },
      });

      act(() => result.current[1]('manual'));
      rerender({ dep: 2 });

      expect(factory).toHaveBeenLastCalledWith('manual');
      expect(result.current[0]).toBe('manual!');
    });

    test('should compare dependencies with Object.is, so NaN does not retrigger', () => {
      const factory = vi.fn(() => 1);
      const { rerender } = renderHook(() => useDependentState(factory, [Number.NaN]));

      rerender();

      expect(factory).toHaveBeenCalledTimes(1);
    });

    test('should recompute when the number of dependencies changes', () => {
      const factory = vi.fn(() => 1);

      const { rerender } = renderHook(({ deps }) => useDependentState(factory, deps), {
        initialProps: { deps: [1] as unknown[] },
      });

      rerender({ deps: [1, 2] });

      expect(factory).toHaveBeenCalledTimes(2);
    });

    test('should recompute for object dependencies that change by reference', () => {
      const factory = vi.fn(() => 1);

      const { rerender } = renderHook(({ dep }) => useDependentState(factory, [dep]), {
        initialProps: { dep: {} },
      });

      rerender({ dep: {} });

      expect(factory).toHaveBeenCalledTimes(2);
    });
  });

  describe('function values', () => {
    test('should store a function returned by the factory', () => {
      const { result } = renderHook(() => useDependentState<FuncState>(() => fnA, []));

      expect(typeof result.current[0]).toBe('function');
      expect(result.current[0]()).toBe('A');
    });

    test('should handle function values with setState', () => {
      const { result } = renderHook(() => useDependentState<FuncState>(() => fnA, []));

      act(() => result.current[1](() => fnB));
      expect(result.current[0]()).toBe('B');

      act(() => {
        result.current[1]((prev) => {
          expect(prev()).toBe('B');
          return fnC;
        });
      });
      expect(result.current[0]()).toBe('C');
    });
  });
});
