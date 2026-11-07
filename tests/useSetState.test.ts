import { describe, expect, test, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useSetState } from '../src/useSetState';

describe('useSetState()', () => {
  describe('initial value', () => {
    test('should default to an empty set', () => {
      const { result } = renderHook(() => useSetState<number>());

      expect(result.current[0]).toBeInstanceOf(Set);
      expect(result.current[0].size).toBe(0);
    });

    test('should start with the items of an array', () => {
      const { result } = renderHook(() => useSetState([1, 2, 3]));

      expect([...result.current[0]]).toEqual([1, 2, 3]);
    });

    test('should drop duplicated items', () => {
      const { result } = renderHook(() => useSetState([1, 1, 2]));

      expect([...result.current[0]]).toEqual([1, 2]);
    });

    test('should accept another Set and copy it', () => {
      const source = new Set([1, 2]);
      const { result } = renderHook(() => useSetState(source));

      expect(result.current[0]).not.toBe(source);
      expect([...result.current[0]]).toEqual([1, 2]);
    });

    test('should not be affected by later changes to the initial iterable', () => {
      const source = new Set([1]);
      const { result } = renderHook(() => useSetState(source));

      source.add(2);

      expect([...result.current[0]]).toEqual([1]);
    });

    test('should accept a lazy initial value', () => {
      const { result } = renderHook(() => useSetState(() => [1, 2]));

      expect([...result.current[0]]).toEqual([1, 2]);
    });

    test('should resolve a lazy initial value only once', () => {
      const factory = vi.fn(() => [1]);
      const { rerender } = renderHook(() => useSetState(factory));

      rerender();

      expect(factory).toHaveBeenCalledTimes(1);
    });
  });

  describe('add()', () => {
    test('should add an item', () => {
      const { result } = renderHook(() => useSetState<number>());

      act(() => result.current[1].add(1));

      expect(result.current[0].has(1)).toBe(true);
    });

    test('should add several items at once', () => {
      const { result } = renderHook(() => useSetState<number>());

      act(() => result.current[1].add(1, 2, 3));

      expect([...result.current[0]]).toEqual([1, 2, 3]);
    });

    test('should keep the existing items', () => {
      const { result } = renderHook(() => useSetState([1]));

      act(() => result.current[1].add(2));

      expect([...result.current[0]]).toEqual([1, 2]);
    });

    test('should create a new Set and never mutate the previous one', () => {
      const { result } = renderHook(() => useSetState([1]));
      const before = result.current[0];

      act(() => result.current[1].add(2));

      expect(result.current[0]).not.toBe(before);
      expect([...before]).toEqual([1]);
    });

    test('should keep the same Set when every item is already there', () => {
      const { result } = renderHook(() => useSetState([1, 2]));
      const before = result.current[0];

      act(() => result.current[1].add(1, 2));

      expect(result.current[0]).toBe(before);
    });

    test('should add only the missing items', () => {
      const { result } = renderHook(() => useSetState([1]));

      act(() => result.current[1].add(1, 2));

      expect([...result.current[0]]).toEqual([1, 2]);
    });

    test('should keep the same Set when called without items', () => {
      const { result } = renderHook(() => useSetState([1]));
      const before = result.current[0];

      act(() => result.current[1].add());

      expect(result.current[0]).toBe(before);
    });

    test('should compare objects by reference', () => {
      const item = { id: 1 };
      const { result } = renderHook(() => useSetState<{ id: number }>());

      act(() => result.current[1].add(item, item, { id: 1 }));

      expect(result.current[0].size).toBe(2);
    });

    test('should accumulate calls inside the same batch', () => {
      const { result } = renderHook(() => useSetState<number>());

      act(() => {
        result.current[1].add(1);
        result.current[1].add(2);
      });

      expect([...result.current[0]]).toEqual([1, 2]);
    });
  });

  describe('remove()', () => {
    test('should remove an item', () => {
      const { result } = renderHook(() => useSetState([1, 2, 3]));

      act(() => result.current[1].remove(2));

      expect([...result.current[0]]).toEqual([1, 3]);
    });

    test('should remove several items at once', () => {
      const { result } = renderHook(() => useSetState([1, 2, 3]));

      act(() => result.current[1].remove(1, 3));

      expect([...result.current[0]]).toEqual([2]);
    });

    test('should create a new Set and never mutate the previous one', () => {
      const { result } = renderHook(() => useSetState([1, 2]));
      const before = result.current[0];

      act(() => result.current[1].remove(1));

      expect(result.current[0]).not.toBe(before);
      expect([...before]).toEqual([1, 2]);
    });

    test('should keep the same Set when no item is there', () => {
      const { result } = renderHook(() => useSetState([1]));
      const before = result.current[0];

      act(() => result.current[1].remove(9));

      expect(result.current[0]).toBe(before);
    });

    test('should ignore the missing items and remove the others', () => {
      const { result } = renderHook(() => useSetState([1, 2]));

      act(() => result.current[1].remove(9, 1));

      expect([...result.current[0]]).toEqual([2]);
    });

    test('should keep the same Set when called without items', () => {
      const { result } = renderHook(() => useSetState([1]));
      const before = result.current[0];

      act(() => result.current[1].remove());

      expect(result.current[0]).toBe(before);
    });
  });

  describe('toggle()', () => {
    test('should add an item that is missing', () => {
      const { result } = renderHook(() => useSetState<number>());

      act(() => result.current[1].toggle(1));

      expect(result.current[0].has(1)).toBe(true);
    });

    test('should remove an item that is there', () => {
      const { result } = renderHook(() => useSetState([1]));

      act(() => result.current[1].toggle(1));

      expect(result.current[0].has(1)).toBe(false);
    });

    test('should flip once per call inside the same batch', () => {
      const { result } = renderHook(() => useSetState<number>());

      act(() => {
        result.current[1].toggle(1);
        result.current[1].toggle(1);
      });

      expect(result.current[0].has(1)).toBe(false);
    });

    test('should add with force true', () => {
      const { result } = renderHook(() => useSetState<number>());

      act(() => result.current[1].toggle(1, true));

      expect(result.current[0].has(1)).toBe(true);
    });

    test('should keep the same Set when forcing true on an item that is there', () => {
      const { result } = renderHook(() => useSetState([1]));
      const before = result.current[0];

      act(() => result.current[1].toggle(1, true));

      expect(result.current[0]).toBe(before);
    });

    test('should remove with force false', () => {
      const { result } = renderHook(() => useSetState([1]));

      act(() => result.current[1].toggle(1, false));

      expect(result.current[0].has(1)).toBe(false);
    });

    test('should keep the same Set when forcing false on a missing item', () => {
      const { result } = renderHook(() => useSetState<number>());
      const before = result.current[0];

      act(() => result.current[1].toggle(1, false));

      expect(result.current[0]).toBe(before);
    });

    test('should create a new Set and never mutate the previous one', () => {
      const { result } = renderHook(() => useSetState([1]));
      const before = result.current[0];

      act(() => result.current[1].toggle(2));

      expect(result.current[0]).not.toBe(before);
      expect([...before]).toEqual([1]);
    });
  });

  describe('replace()', () => {
    test('should replace the whole set', () => {
      const { result } = renderHook(() => useSetState([1, 2]));

      act(() => result.current[1].replace([3, 4]));

      expect([...result.current[0]]).toEqual([3, 4]);
    });

    test('should accept any iterable and copy it', () => {
      const source = new Set([5]);
      const { result } = renderHook(() => useSetState<number>());

      act(() => result.current[1].replace(source));

      expect(result.current[0]).not.toBe(source);
      expect([...result.current[0]]).toEqual([5]);
    });

    test('should accept an empty iterable', () => {
      const { result } = renderHook(() => useSetState([1]));

      act(() => result.current[1].replace([]));

      expect(result.current[0].size).toBe(0);
    });
  });

  describe('clear()', () => {
    test('should empty the set', () => {
      const { result } = renderHook(() => useSetState([1, 2]));

      act(() => result.current[1].clear());

      expect(result.current[0].size).toBe(0);
    });

    test('should keep the same Set when it is already empty', () => {
      const { result } = renderHook(() => useSetState<number>());
      const before = result.current[0];

      act(() => result.current[1].clear());

      expect(result.current[0]).toBe(before);
    });
  });

  describe('re-renders', () => {
    test('should not re-render when an action changes nothing', () => {
      let renders = 0;
      const { result } = renderHook(() => {
        renders++;
        return useSetState([1]);
      });

      const before = renders;
      act(() => {
        result.current[1].add(1);
        result.current[1].remove(9);
        result.current[1].toggle(1, true);
      });

      expect(renders).toBe(before);
    });
  });

  describe('identity', () => {
    test('actions should be stable between renders', () => {
      const { result, rerender } = renderHook(() => useSetState([1]));
      const [, actions] = result.current;

      act(() => actions.add(2));
      rerender();

      expect(result.current[1]).toBe(actions);
    });
  });
});
