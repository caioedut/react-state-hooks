import { describe, expect, test, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useObjectState } from '../src/useObjectState';

type Person = {
  name: string;
  age?: number;
};

describe('useObjectState()', () => {
  describe('initial value', () => {
    test('should start with the given object', () => {
      const initial = { name: 'Richard' };
      const { result } = renderHook(() => useObjectState<Person>(initial));

      expect(result.current[0]).toBe(initial);
    });

    test('should accept a lazy initial value', () => {
      const { result } = renderHook(() => useObjectState<Person>(() => ({ name: 'Lazy' })));

      expect(result.current[0]).toEqual({ name: 'Lazy' });
    });

    test('should resolve a lazy initial value only once', () => {
      const factory = vi.fn(() => ({ name: 'Lazy' }));
      const { rerender } = renderHook(() => useObjectState<Person>(factory));

      rerender();

      expect(factory).toHaveBeenCalledTimes(1);
    });
  });

  describe('patch()', () => {
    test('should add props to the object', () => {
      const { result } = renderHook(() => useObjectState<Person>({ name: 'Richard' }));

      act(() => result.current[1]({ age: 21 }));

      expect(result.current[0]).toEqual({ name: 'Richard', age: 21 });
    });

    test('should overwrite existing props', () => {
      const { result } = renderHook(() => useObjectState<Person>({ name: 'Richard', age: 20 }));

      act(() => result.current[1]({ age: 21 }));

      expect(result.current[0]).toEqual({ name: 'Richard', age: 21 });
    });

    test('should create a new object and keep the previous one untouched', () => {
      const initial = { name: 'Richard' };
      const { result } = renderHook(() => useObjectState<Person>(initial));

      act(() => result.current[1]({ age: 21 }));

      expect(result.current[0]).not.toBe(initial);
      expect(initial).toEqual({ name: 'Richard' });
    });

    test('should accept a function of the previous state', () => {
      const { result } = renderHook(() => useObjectState<Person>({ name: 'Richard', age: 20 }));

      act(() => result.current[1]((prev) => ({ age: (prev.age ?? 0) + 1 })));

      expect(result.current[0]).toEqual({ name: 'Richard', age: 21 });
    });

    test('should apply function patches sequentially inside the same batch', () => {
      const { result } = renderHook(() => useObjectState<Person>({ name: 'Richard', age: 20 }));

      act(() => {
        result.current[1]((prev) => ({ age: (prev.age ?? 0) + 1 }));
        result.current[1]((prev) => ({ age: (prev.age ?? 0) + 1 }));
      });

      expect(result.current[0]).toEqual({ name: 'Richard', age: 22 });
    });

    test('should accept an empty patch', () => {
      const { result } = renderHook(() => useObjectState<Person>({ name: 'Richard' }));

      act(() => result.current[1]({}));

      expect(result.current[0]).toEqual({ name: 'Richard' });
    });
  });

  describe('set()', () => {
    test('should replace the whole object', () => {
      const { result } = renderHook(() => useObjectState<Person>({ name: 'Richard', age: 21 }));
      const replacement = { name: 'Ward' };

      act(() => result.current[2].set(replacement));

      expect(result.current[0]).toBe(replacement);
      expect(result.current[0]).toEqual({ name: 'Ward' });
    });
  });

  describe('reset()', () => {
    test('should restore the initial value', () => {
      const initial = { name: 'Richard' };
      const { result } = renderHook(() => useObjectState<Person>(initial));

      act(() => result.current[1]({ name: 'Ward', age: 30 }));
      act(() => result.current[2].reset());

      expect(result.current[0]).toBe(initial);
    });

    test('should restore the resolved lazy value, not call the factory again', () => {
      const factory = vi.fn(() => ({ name: 'Lazy' }));
      const { result } = renderHook(() => useObjectState<Person>(factory));
      const first = result.current[0];

      act(() => result.current[1]({ age: 1 }));
      act(() => result.current[2].reset());

      expect(result.current[0]).toBe(first);
      expect(factory).toHaveBeenCalledTimes(1);
    });

    test('should restore the initial value after set()', () => {
      const { result } = renderHook(() => useObjectState<Person>({ name: 'Richard' }));

      act(() => result.current[2].set({ name: 'Ward' }));
      act(() => result.current[2].reset());

      expect(result.current[0]).toEqual({ name: 'Richard' });
    });
  });

  describe('identity', () => {
    test('patch, set and reset should be stable between renders', () => {
      const { result, rerender } = renderHook(() => useObjectState<Person>({ name: 'Richard' }));
      const [, patch, actions] = result.current;

      act(() => patch({ age: 1 }));
      rerender();

      expect(result.current[1]).toBe(patch);
      expect(result.current[2].set).toBe(actions.set);
      expect(result.current[2].reset).toBe(actions.reset);
    });
  });
});
