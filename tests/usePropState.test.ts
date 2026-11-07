import { describe, expect, test, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { usePropState } from '../src/usePropState';

describe('usePropState()', () => {
  describe('initial value', () => {
    test('should start with the prop when it is defined', () => {
      const { result } = renderHook(() => usePropState('Richard'));

      expect(result.current[0]).toBe('Richard');
    });

    test('should prefer the prop over the initial state', () => {
      const { result } = renderHook(() => usePropState<string>('Richard', 'Ward'));

      expect(result.current[0]).toBe('Richard');
    });

    test('should not call a lazy initial state when the prop is defined', () => {
      const factory = vi.fn(() => 'Ward');

      renderHook(() => usePropState<string>('Richard', factory));

      expect(factory).not.toHaveBeenCalled();
    });

    test('should fall back to the initial state when the prop is undefined', () => {
      const { result } = renderHook(() => usePropState(undefined, 'Richard'));

      expect(result.current[0]).toBe('Richard');
    });

    test('should fall back to a lazy initial state when the prop is undefined', () => {
      const { result } = renderHook(() => usePropState(undefined, () => 'Richard'));

      expect(result.current[0]).toBe('Richard');
    });

    test('should resolve a lazy initial state only once', () => {
      const factory = vi.fn(() => 'Richard');
      const { rerender } = renderHook(() => usePropState(undefined, factory));

      rerender();

      expect(factory).toHaveBeenCalledTimes(1);
    });

    test('should be undefined without prop and without initial state', () => {
      const { result } = renderHook(() => usePropState<string | undefined>(undefined));

      expect(result.current[0]).toBeUndefined();
    });

    test.each([[0], [''], [false], [null]])('should use the falsy prop %p', (prop) => {
      const { result } = renderHook(() => usePropState<unknown>(prop, 'fallback'));

      expect(result.current[0]).toBe(prop);
    });
  });

  describe('setState()', () => {
    test('should update the state value', () => {
      const { result } = renderHook(() => usePropState('Richard'));

      act(() => result.current[1]('Ward'));

      expect(result.current[0]).toBe('Ward');
    });

    test('should accept an updater that receives the current value', () => {
      const { result } = renderHook(() => usePropState(1));

      act(() => result.current[1]((prev) => prev + 1));

      expect(result.current[0]).toBe(2);
    });

    test('should apply updaters sequentially inside the same batch', () => {
      const { result } = renderHook(() => usePropState(0));

      act(() => {
        result.current[1]((prev) => prev + 1);
        result.current[1]((prev) => prev + 1);
      });

      expect(result.current[0]).toBe(2);
    });

    test('should keep its identity between renders and prop changes', () => {
      const { result, rerender } = renderHook(({ name }) => usePropState(name), {
        initialProps: { name: 'Richard' },
      });
      const setState = result.current[1];

      rerender({ name: 'Ward' });

      expect(result.current[1]).toBe(setState);
    });
  });

  describe('prop changes', () => {
    test('should update the state when the prop changes', () => {
      const { result, rerender } = renderHook(({ name }) => usePropState(name), {
        initialProps: { name: 'Richard' },
      });

      rerender({ name: 'Ward' });

      expect(result.current[0]).toBe('Ward');
    });

    test('should override a local update when the prop changes', () => {
      const { result, rerender } = renderHook(({ name }) => usePropState(name), {
        initialProps: { name: 'Richard' },
      });

      act(() => result.current[1]('Local'));
      expect(result.current[0]).toBe('Local');

      rerender({ name: 'Ward' });
      expect(result.current[0]).toBe('Ward');
    });

    test('should keep a local update while the prop stays the same', () => {
      const { result, rerender } = renderHook(({ name }) => usePropState(name), {
        initialProps: { name: 'Richard' },
      });

      act(() => result.current[1]('Local'));
      rerender({ name: 'Richard' });

      expect(result.current[0]).toBe('Local');
    });

    test('should keep the current state while the prop is undefined', () => {
      const { result, rerender } = renderHook(({ name }) => usePropState<string>(name, 'Default'), {
        initialProps: { name: 'Richard' as string | undefined },
      });

      rerender({ name: undefined });

      expect(result.current[0]).toBe('Richard');
    });

    test('should follow the prop again when it goes back to a defined value', () => {
      const { result, rerender } = renderHook(({ name }) => usePropState<string>(name, 'Default'), {
        initialProps: { name: 'Richard' as string | undefined },
      });

      rerender({ name: undefined });
      act(() => result.current[1]('Local'));
      rerender({ name: 'Richard' });

      expect(result.current[0]).toBe('Richard');
    });

    test('should compare the prop with Object.is, so NaN does not retrigger', () => {
      const { result, rerender } = renderHook(({ value }) => usePropState(value), {
        initialProps: { value: Number.NaN },
      });

      act(() => result.current[1](1));
      rerender({ value: Number.NaN });

      expect(result.current[0]).toBe(1);
    });

    test('should never render a stale value when the prop changes', () => {
      const seen: string[] = [];

      const { rerender } = renderHook(
        ({ name }) => {
          const [value] = usePropState(name);
          seen.push(value);
          return value;
        },
        { initialProps: { name: 'Richard' } },
      );

      rerender({ name: 'Ward' });

      expect(seen[0]).toBe('Richard');
      expect(seen.slice(1).every((value) => value === 'Ward')).toBe(true);
    });
  });
});
