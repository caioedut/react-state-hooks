import { describe, expect, test, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useListState } from '../src/useListState';

type Item = { id: number; name: string };

const items: Item[] = [
  { id: 1, name: 'a' },
  { id: 2, name: 'b' },
  { id: 3, name: 'c' },
];

describe('useListState()', () => {
  describe('initial value', () => {
    test('should default to an empty list', () => {
      const { result } = renderHook(() => useListState<number>());

      expect(result.current[0]).toEqual([]);
    });

    test('should start with the given list', () => {
      const { result } = renderHook(() => useListState([1, 2, 3]));

      expect(result.current[0]).toEqual([1, 2, 3]);
    });

    test('should accept a lazy initial list', () => {
      const { result } = renderHook(() => useListState(() => [1, 2]));

      expect(result.current[0]).toEqual([1, 2]);
    });

    test('should resolve a lazy initial list only once', () => {
      const factory = vi.fn(() => [1]);
      const { rerender } = renderHook(() => useListState(factory));

      rerender();

      expect(factory).toHaveBeenCalledTimes(1);
    });
  });

  describe('set()', () => {
    test('should replace the list with new values', () => {
      const { result } = renderHook(() => useListState<number>());

      act(() => result.current[1].set([1, 2, 3]));

      expect(result.current[0]).toEqual([1, 2, 3]);
    });

    test('should copy the given items instead of keeping the reference', () => {
      const source = [1, 2];
      const { result } = renderHook(() => useListState<number>());

      act(() => result.current[1].set(source));
      source.push(3);

      expect(result.current[0]).toEqual([1, 2]);
    });

    test('should accept a readonly list', () => {
      const source: readonly number[] = [1, 2];
      const { result } = renderHook(() => useListState<number>());

      act(() => result.current[1].set(source));

      expect(result.current[0]).toEqual([1, 2]);
    });

    test('should accept an empty list', () => {
      const { result } = renderHook(() => useListState([1, 2]));

      act(() => result.current[1].set([]));

      expect(result.current[0]).toEqual([]);
    });
  });

  describe('clear()', () => {
    test('should empty the list', () => {
      const { result } = renderHook(() => useListState([1, 2, 3]));

      act(() => result.current[1].clear());

      expect(result.current[0]).toEqual([]);
    });

    test('should work on an empty list', () => {
      const { result } = renderHook(() => useListState<number>());

      act(() => result.current[1].clear());

      expect(result.current[0]).toEqual([]);
    });
  });

  describe('push()', () => {
    test('should add items to the end of the list', () => {
      const { result } = renderHook(() => useListState<number>());

      act(() => result.current[1].push(1, 2, 3));

      expect(result.current[0]).toEqual([1, 2, 3]);
    });

    test('should keep the existing items', () => {
      const { result } = renderHook(() => useListState([1]));

      act(() => result.current[1].push(2));

      expect(result.current[0]).toEqual([1, 2]);
    });

    test('should add duplicate values', () => {
      const { result } = renderHook(() => useListState([1]));

      act(() => result.current[1].push(1, 1));

      expect(result.current[0]).toEqual([1, 1, 1]);
    });

    test('should accept no items', () => {
      const { result } = renderHook(() => useListState([1]));

      act(() => result.current[1].push());

      expect(result.current[0]).toEqual([1]);
    });

    test('should accumulate calls inside the same batch', () => {
      const { result } = renderHook(() => useListState<number>());

      act(() => {
        result.current[1].push(1);
        result.current[1].push(2);
      });

      expect(result.current[0]).toEqual([1, 2]);
    });
  });

  describe('insert()', () => {
    test('should add an item at the given index', () => {
      const { result } = renderHook(() => useListState([1, 3]));

      act(() => result.current[1].insert(1, 2));

      expect(result.current[0]).toEqual([1, 2, 3]);
    });

    test('should add at the start with index 0', () => {
      const { result } = renderHook(() => useListState([2, 3]));

      act(() => result.current[1].insert(0, 1));

      expect(result.current[0]).toEqual([1, 2, 3]);
    });

    test('should add at the end when the index is out of bounds', () => {
      const { result } = renderHook(() => useListState([1, 2]));

      act(() => result.current[1].insert(10, 3));

      expect(result.current[0]).toEqual([1, 2, 3]);
    });

    test('should count negative indexes from the end', () => {
      const { result } = renderHook(() => useListState([1, 3]));

      act(() => result.current[1].insert(-1, 2));

      expect(result.current[0]).toEqual([1, 2, 3]);
    });
  });

  describe('remove()', () => {
    test('should remove an item by index', () => {
      const { result } = renderHook(() => useListState([1, 2, 3]));

      act(() => result.current[1].remove(1));

      expect(result.current[0]).toEqual([1, 3]);
    });

    test('should ignore an out of bounds index', () => {
      const { result } = renderHook(() => useListState([1, 2, 3]));

      act(() => result.current[1].remove(10));
      act(() => result.current[1].remove(-1));

      expect(result.current[0]).toEqual([1, 2, 3]);
    });

    test('should remove every item that matches a handler', () => {
      const { result } = renderHook(() => useListState([1, 2, 3, 4]));

      act(() => result.current[1].remove((item) => item % 2 === 0));

      expect(result.current[0]).toEqual([1, 3]);
    });

    test('should give the handler the item and its index', () => {
      const handler = vi.fn(() => false);
      const { result } = renderHook(() => useListState(['a', 'b']));

      act(() => result.current[1].remove(handler));

      expect(handler).toHaveBeenCalledWith('a', 0);
      expect(handler).toHaveBeenCalledWith('b', 1);
    });

    test('should keep the list when nothing matches the handler', () => {
      const { result } = renderHook(() => useListState([1, 2]));

      act(() => result.current[1].remove(() => false));

      expect(result.current[0]).toEqual([1, 2]);
    });
  });

  describe('update()', () => {
    test('should replace the item at the given index', () => {
      const { result } = renderHook(() => useListState(items));

      act(() => result.current[1].update(1, { id: 2, name: 'updated' }));

      expect(result.current[0]?.[1]).toEqual({ id: 2, name: 'updated' });
      expect(result.current[0]).toHaveLength(3);
    });

    test('should ignore an out of bounds index', () => {
      const { result } = renderHook(() => useListState([1, 2, 3]));

      act(() => result.current[1].update(10, 99));

      expect(result.current[0]).toEqual([1, 2, 3]);
    });

    test('should replace every item that matches a handler', () => {
      const { result } = renderHook(() => useListState([1, 2, 3, 4]));

      act(() => result.current[1].update((item) => item % 2 === 0, 0));

      expect(result.current[0]).toEqual([1, 0, 3, 0]);
    });

    test('should keep the list when nothing matches the handler', () => {
      const { result } = renderHook(() => useListState([1, 2]));

      act(() => result.current[1].update(() => false, 99));

      expect(result.current[0]).toEqual([1, 2]);
    });

    test('should give the handler the item and its index', () => {
      const handler = vi.fn(() => false);
      const { result } = renderHook(() => useListState(['a', 'b']));

      act(() => result.current[1].update(handler, 'x'));

      expect(handler).toHaveBeenCalledWith('a', 0);
      expect(handler).toHaveBeenCalledWith('b', 1);
    });
  });

  describe('filter()', () => {
    test('should keep only the items that match', () => {
      const { result } = renderHook(() => useListState([1, 2, 3]));

      act(() => result.current[1].filter((item) => item > 1));

      expect(result.current[0]).toEqual([2, 3]);
    });

    test('should give the predicate the item, its index and the list', () => {
      const predicate = vi.fn(() => true);
      const { result } = renderHook(() => useListState(['a', 'b']));

      act(() => result.current[1].filter(predicate));

      expect(predicate).toHaveBeenCalledWith('a', 0, ['a', 'b']);
      expect(predicate).toHaveBeenCalledWith('b', 1, ['a', 'b']);
    });

    test('should empty the list when nothing matches', () => {
      const { result } = renderHook(() => useListState([1, 2]));

      act(() => result.current[1].filter(() => false));

      expect(result.current[0]).toEqual([]);
    });
  });

  describe('sort()', () => {
    test('should sort the list with the default order', () => {
      const { result } = renderHook(() => useListState([3, 2, 1]));

      act(() => result.current[1].sort());

      expect(result.current[0]).toEqual([1, 2, 3]);
    });

    test('should sort with a compare function', () => {
      const { result } = renderHook(() => useListState([1, 3, 2]));

      act(() => result.current[1].sort((a, b) => b - a));

      expect(result.current[0]).toEqual([3, 2, 1]);
    });

    test('should handle an empty list', () => {
      const { result } = renderHook(() => useListState<number>());

      act(() => result.current[1].sort());

      expect(result.current[0]).toEqual([]);
    });

    test('should not mutate the previous list', () => {
      const { result } = renderHook(() => useListState([3, 2, 1]));
      const before = result.current[0];

      act(() => result.current[1].sort());

      expect(before).toEqual([3, 2, 1]);
      expect(result.current[0]).toEqual([1, 2, 3]);
    });
  });

  describe('immutability', () => {
    test('should never mutate the initial list', () => {
      const initial = [1, 2, 3];
      const { result } = renderHook(() => useListState(initial));

      act(() => {
        result.current[1].push(4);
        result.current[1].insert(0, 0);
        result.current[1].remove(1);
        result.current[1].update(0, 9);
        result.current[1].sort();
      });

      expect(initial).toEqual([1, 2, 3]);
    });

    test('should return a new list on every change', () => {
      const { result } = renderHook(() => useListState([1]));
      const before = result.current[0];

      act(() => result.current[1].push(2));

      expect(result.current[0]).not.toBe(before);
    });
  });

  describe('identity', () => {
    test('actions should be stable between renders', () => {
      const { result, rerender } = renderHook(() => useListState([1]));
      const [, actions] = result.current;

      act(() => actions.push(2));
      rerender();

      expect(result.current[1]).toBe(actions);
    });
  });
});
