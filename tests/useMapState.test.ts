import { describe, expect, test, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useMapState } from '../src/useMapState';

type User = { name: string };

describe('useMapState()', () => {
  describe('initial value', () => {
    test('should default to an empty map', () => {
      const { result } = renderHook(() => useMapState<number, string>());

      expect(result.current[0]).toBeInstanceOf(Map);
      expect(result.current[0].size).toBe(0);
    });

    test('should start with the entries of an array', () => {
      const { result } = renderHook(() =>
        useMapState([
          [1, 'a'],
          [2, 'b'],
        ]),
      );

      expect([...result.current[0]]).toEqual([
        [1, 'a'],
        [2, 'b'],
      ]);
    });

    test('should accept another Map and copy it', () => {
      const source = new Map([[1, 'a']]);
      const { result } = renderHook(() => useMapState(source));

      expect(result.current[0]).not.toBe(source);
      expect(result.current[0].get(1)).toBe('a');
    });

    test('should not be affected by later changes to the initial iterable', () => {
      const source = new Map([[1, 'a']]);
      const { result } = renderHook(() => useMapState(source));

      source.set(2, 'b');

      expect(result.current[0].size).toBe(1);
    });

    test('should accept a lazy initial value', () => {
      const { result } = renderHook(() => useMapState(() => [[1, 'a']] as const));

      expect(result.current[0].get(1)).toBe('a');
    });

    test('should resolve a lazy initial value only once', () => {
      const factory = vi.fn(() => [[1, 'a']] as const);
      const { rerender } = renderHook(() => useMapState(factory));

      rerender();

      expect(factory).toHaveBeenCalledTimes(1);
    });
  });

  describe('set()', () => {
    test('should add an entry', () => {
      const { result } = renderHook(() => useMapState<number, string>());

      act(() => result.current[1].set(1, 'a'));

      expect(result.current[0].get(1)).toBe('a');
    });

    test('should replace the value of an existing key', () => {
      const { result } = renderHook(() => useMapState([[1, 'a']]));

      act(() => result.current[1].set(1, 'b'));

      expect(result.current[0].get(1)).toBe('b');
      expect(result.current[0].size).toBe(1);
    });

    test('should create a new Map and never mutate the previous one', () => {
      const { result } = renderHook(() => useMapState([[1, 'a']]));
      const before = result.current[0];

      act(() => result.current[1].set(2, 'b'));

      expect(result.current[0]).not.toBe(before);
      expect(before.size).toBe(1);
    });

    test('should keep the same Map when the value is the same', () => {
      const { result } = renderHook(() => useMapState([[1, 'a']]));
      const before = result.current[0];

      act(() => result.current[1].set(1, 'a'));

      expect(result.current[0]).toBe(before);
    });

    test('should add a key with an undefined value', () => {
      const { result } = renderHook(() => useMapState<number, string | undefined>());

      act(() => result.current[1].set(1, undefined));

      expect(result.current[0].has(1)).toBe(true);
    });

    test('should keep the same Map when setting undefined on a key that already holds it', () => {
      const { result } = renderHook(() => useMapState<number, string | undefined>([[1, undefined]]));
      const before = result.current[0];

      act(() => result.current[1].set(1, undefined));

      expect(result.current[0]).toBe(before);
    });

    test('should compare object keys by reference', () => {
      const key = { id: 1 };
      const { result } = renderHook(() => useMapState<{ id: number }, string>());

      act(() => {
        result.current[1].set(key, 'a');
        result.current[1].set({ id: 1 }, 'b');
      });

      expect(result.current[0].size).toBe(2);
      expect(result.current[0].get(key)).toBe('a');
    });

    test('should accumulate calls inside the same batch', () => {
      const { result } = renderHook(() => useMapState<number, string>());

      act(() => {
        result.current[1].set(1, 'a');
        result.current[1].set(2, 'b');
      });

      expect(result.current[0].size).toBe(2);
    });
  });

  describe('update()', () => {
    test('should set the value from the previous one', () => {
      const { result } = renderHook(() => useMapState<number, User>([[1, { name: 'Richard' }]]));

      act(() => result.current[1].update(1, (user) => ({ ...user, name: 'Ward' })));

      expect(result.current[0].get(1)).toEqual({ name: 'Ward' });
    });

    test('should give the updater undefined when the key is missing', () => {
      const updater = vi.fn(() => 'new');
      const { result } = renderHook(() => useMapState<number, string>());

      act(() => result.current[1].update(1, updater));

      expect(updater).toHaveBeenCalledWith(undefined);
      expect(result.current[0].get(1)).toBe('new');
    });

    test('should create a new Map and never mutate the previous one', () => {
      const { result } = renderHook(() => useMapState([[1, 1]]));
      const before = result.current[0];

      act(() => result.current[1].update(1, (value = 0) => value + 1));

      expect(result.current[0]).not.toBe(before);
      expect(before.get(1)).toBe(1);
    });

    test('should keep the same Map when the value does not change', () => {
      const { result } = renderHook(() => useMapState([[1, 1]]));
      const before = result.current[0];

      act(() => result.current[1].update(1, (value = 0) => value));

      expect(result.current[0]).toBe(before);
    });

    test('should apply updates sequentially inside the same batch', () => {
      const { result } = renderHook(() => useMapState([[1, 0]]));

      act(() => {
        result.current[1].update(1, (value = 0) => value + 1);
        result.current[1].update(1, (value = 0) => value + 1);
      });

      expect(result.current[0].get(1)).toBe(2);
    });
  });

  describe('remove()', () => {
    test('should remove an entry', () => {
      const { result } = renderHook(() =>
        useMapState([
          [1, 'a'],
          [2, 'b'],
        ]),
      );

      act(() => result.current[1].remove(1));

      expect([...result.current[0].keys()]).toEqual([2]);
    });

    test('should remove several entries at once', () => {
      const { result } = renderHook(() =>
        useMapState([
          [1, 'a'],
          [2, 'b'],
          [3, 'c'],
        ]),
      );

      act(() => result.current[1].remove(1, 3));

      expect([...result.current[0].keys()]).toEqual([2]);
    });

    test('should create a new Map and never mutate the previous one', () => {
      const { result } = renderHook(() => useMapState([[1, 'a']]));
      const before = result.current[0];

      act(() => result.current[1].remove(1));

      expect(result.current[0]).not.toBe(before);
      expect(before.size).toBe(1);
    });

    test('should keep the same Map when no key is there', () => {
      const { result } = renderHook(() => useMapState([[1, 'a']]));
      const before = result.current[0];

      act(() => result.current[1].remove(9));

      expect(result.current[0]).toBe(before);
    });

    test('should ignore the missing keys and remove the others', () => {
      const { result } = renderHook(() =>
        useMapState([
          [1, 'a'],
          [2, 'b'],
        ]),
      );

      act(() => result.current[1].remove(9, 1));

      expect([...result.current[0].keys()]).toEqual([2]);
    });

    test('should keep the same Map when called without keys', () => {
      const { result } = renderHook(() => useMapState([[1, 'a']]));
      const before = result.current[0];

      act(() => result.current[1].remove());

      expect(result.current[0]).toBe(before);
    });
  });

  describe('replace()', () => {
    test('should replace the whole map', () => {
      const { result } = renderHook(() => useMapState([[1, 'a']]));

      act(() => result.current[1].replace([[2, 'b']]));

      expect([...result.current[0]]).toEqual([[2, 'b']]);
    });

    test('should accept another Map and copy it', () => {
      const source = new Map([[3, 'c']]);
      const { result } = renderHook(() => useMapState<number, string>());

      act(() => result.current[1].replace(source));

      expect(result.current[0]).not.toBe(source);
      expect(result.current[0].get(3)).toBe('c');
    });

    test('should accept an empty iterable', () => {
      const { result } = renderHook(() => useMapState([[1, 'a']]));

      act(() => result.current[1].replace([]));

      expect(result.current[0].size).toBe(0);
    });
  });

  describe('clear()', () => {
    test('should empty the map', () => {
      const { result } = renderHook(() => useMapState([[1, 'a']]));

      act(() => result.current[1].clear());

      expect(result.current[0].size).toBe(0);
    });

    test('should keep the same Map when it is already empty', () => {
      const { result } = renderHook(() => useMapState<number, string>());
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
        return useMapState([[1, 'a']]);
      });

      const before = renders;
      act(() => {
        result.current[1].set(1, 'a');
        result.current[1].remove(9);
      });

      expect(renders).toBe(before);
    });
  });

  describe('identity', () => {
    test('actions should be stable between renders', () => {
      const { result, rerender } = renderHook(() => useMapState([[1, 'a']]));
      const [, actions] = result.current;

      act(() => actions.set(2, 'b'));
      rerender();

      expect(result.current[1]).toBe(actions);
    });
  });
});
