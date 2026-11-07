import { describe, expect, test, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useHistoryState } from '../src/useHistoryState';

describe('useHistoryState()', () => {
  describe('initial value', () => {
    test('should start with the given value and a history with only that value', () => {
      const { result } = renderHook(() => useHistoryState(1));

      expect(result.current[0]).toBe(1);
      expect(result.current[2].history).toEqual([1]);
      expect(result.current[2].future).toEqual([]);
    });

    test('should accept a lazy initial value', () => {
      const { result } = renderHook(() => useHistoryState(() => 'lazy'));

      expect(result.current[0]).toBe('lazy');
      expect(result.current[2].history).toEqual(['lazy']);
    });

    test('should resolve a lazy initial value only once', () => {
      const factory = vi.fn(() => 1);
      const { rerender } = renderHook(() => useHistoryState(factory));

      rerender();

      expect(factory).toHaveBeenCalledTimes(1);
    });

    test('should start as undefined with an empty history when there is no initial value', () => {
      const { result } = renderHook(() => useHistoryState<number>());

      expect(result.current[0]).toBeUndefined();
      expect(result.current[2].history).toEqual([]);
    });

    test.each([[0], [''], [false], [null]])('should keep the falsy initial value %p in the history', (value) => {
      const { result } = renderHook(() => useHistoryState(value));

      expect(result.current[0]).toBe(value);
      expect(result.current[2].history).toEqual([value]);
    });

    test('should not be able to undo or redo at first', () => {
      const { result } = renderHook(() => useHistoryState(1));

      expect(result.current[2].canUndo).toBe(false);
      expect(result.current[2].canRedo).toBe(false);
    });
  });

  describe('setState()', () => {
    test('should update the state value', () => {
      const { result } = renderHook(() => useHistoryState(1));

      act(() => result.current[1](2));

      expect(result.current[0]).toBe(2);
    });

    test('should add the new value to the history', () => {
      const { result } = renderHook(() => useHistoryState(1));

      act(() => result.current[1](2));

      expect(result.current[2].history).toEqual([1, 2]);
    });

    test('should add the first value once when there was no initial value', () => {
      const { result } = renderHook(() => useHistoryState<number>());

      act(() => result.current[1](1));

      expect(result.current[0]).toBe(1);
      expect(result.current[2].history).toEqual([1]);
    });

    test('should accept an updater that receives the current value', () => {
      const { result } = renderHook(() => useHistoryState(1));

      act(() => result.current[1]((prev) => prev + 1));

      expect(result.current[0]).toBe(2);
    });

    test('should give the updater undefined when there is no value yet', () => {
      const updater = vi.fn(() => 1);
      const { result } = renderHook(() => useHistoryState<number>());

      act(() => result.current[1](updater));

      expect(updater).toHaveBeenCalledWith(undefined);
    });

    test('should apply updaters sequentially inside the same batch', () => {
      const { result } = renderHook(() => useHistoryState(0));

      act(() => {
        result.current[1]((prev) => prev + 1);
        result.current[1]((prev) => prev + 1);
      });

      expect(result.current[0]).toBe(2);
      expect(result.current[2].history).toEqual([0, 1, 2]);
    });

    test('should not repeat the current value in the history', () => {
      const { result } = renderHook(() => useHistoryState(1));

      act(() => result.current[1](1));

      expect(result.current[2].history).toEqual([1]);
    });

    test('should not change the history reference when the value is repeated', () => {
      const { result } = renderHook(() => useHistoryState(1));
      const before = result.current[2].history;

      act(() => result.current[1](1));

      expect(result.current[2].history).toBe(before);
    });

    test('should keep the redo list when the value is repeated', () => {
      const { result } = renderHook(() => useHistoryState(1));

      act(() => result.current[1](2));
      act(() => result.current[2].undo());
      act(() => result.current[1](1));

      expect(result.current[2].future).toEqual([2]);
    });

    test('should repeat a value that is not the current one', () => {
      const { result } = renderHook(() => useHistoryState(1));

      act(() => result.current[1](2));
      act(() => result.current[1](1));

      expect(result.current[2].history).toEqual([1, 2, 1]);
    });

    test('should treat NaN as equal to NaN', () => {
      const { result } = renderHook(() => useHistoryState(Number.NaN));

      act(() => result.current[1](Number.NaN));

      expect(result.current[2].history).toHaveLength(1);
    });

    test('should be able to store undefined as a value', () => {
      const { result } = renderHook(() => useHistoryState<number | undefined>(1));

      act(() => result.current[1](undefined));

      expect(result.current[0]).toBeUndefined();
      expect(result.current[2].history).toEqual([1, undefined]);
    });

    test('should return a new history array on every change and never mutate the old one', () => {
      const { result } = renderHook(() => useHistoryState(1));
      const before = result.current[2].history;

      act(() => result.current[1](2));

      expect(result.current[2].history).not.toBe(before);
      expect(before).toEqual([1]);
    });

    test('should discard the values that could be redone', () => {
      const { result } = renderHook(() => useHistoryState(1));

      act(() => result.current[1](2));
      act(() => result.current[1](3));
      act(() => result.current[2].undo(2));
      expect(result.current[2].future).toEqual([2, 3]);

      act(() => result.current[1](9));

      expect(result.current[2].future).toEqual([]);
      expect(result.current[2].canRedo).toBe(false);
      expect(result.current[2].history).toEqual([1, 9]);
    });
  });

  describe('length', () => {
    test('should keep only the last 10 values by default', () => {
      const { result } = renderHook(() => useHistoryState<number>());

      for (let value = 1; value <= 11; value++) {
        act(() => result.current[1](value));
      }

      expect(result.current[2].history).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
    });

    test('should respect a custom length', () => {
      const { result } = renderHook(() => useHistoryState(0, 3));

      for (let value = 1; value <= 5; value++) {
        act(() => result.current[1](value));
      }

      expect(result.current[2].history).toEqual([3, 4, 5]);
    });

    test('should keep at least the current value when length is smaller than 1', () => {
      const { result } = renderHook(() => useHistoryState(0, 0));

      act(() => result.current[1](1));
      act(() => result.current[1](2));

      expect(result.current[2].history).toEqual([2]);
    });

    test('should floor a fractional length', () => {
      const { result } = renderHook(() => useHistoryState(0, 2.9));

      for (let value = 1; value <= 4; value++) {
        act(() => result.current[1](value));
      }

      expect(result.current[2].history).toEqual([3, 4]);
    });

    test('should use the latest length', () => {
      const { result, rerender } = renderHook(({ length }) => useHistoryState(0, length), {
        initialProps: { length: 5 },
      });

      rerender({ length: 2 });
      act(() => result.current[1](1));
      act(() => result.current[1](2));

      expect(result.current[2].history).toEqual([1, 2]);
    });

    test('should keep the history within length when redoing', () => {
      const { result, rerender } = renderHook(({ length }) => useHistoryState(0, length), {
        initialProps: { length: 4 },
      });

      act(() => result.current[1](1));
      act(() => result.current[1](2));
      act(() => result.current[1](3));
      act(() => result.current[2].undo(3));

      rerender({ length: 2 });
      act(() => result.current[2].redo(3));

      expect(result.current[2].history).toEqual([2, 3]);
      expect(result.current[0]).toBe(3);
    });
  });

  describe('undo()', () => {
    test('should restore the previous value', () => {
      const { result } = renderHook(() => useHistoryState(1));

      act(() => result.current[1](2));
      act(() => result.current[2].undo());

      expect(result.current[0]).toBe(1);
      expect(result.current[2].history).toEqual([1]);
    });

    test('should move the undone value to the redo list', () => {
      const { result } = renderHook(() => useHistoryState(1));

      act(() => result.current[1](2));
      act(() => result.current[2].undo());

      expect(result.current[2].future).toEqual([2]);
      expect(result.current[2].canRedo).toBe(true);
      expect(result.current[2].canUndo).toBe(false);
    });

    test('should go back several steps, keeping the order of the redo list', () => {
      const { result } = renderHook(() => useHistoryState(1));

      act(() => result.current[1](2));
      act(() => result.current[1](3));
      act(() => result.current[1](4));
      act(() => result.current[2].undo(2));

      expect(result.current[0]).toBe(2);
      expect(result.current[2].history).toEqual([1, 2]);
      expect(result.current[2].future).toEqual([3, 4]);
    });

    test('should keep older undone values after the ones undone later', () => {
      const { result } = renderHook(() => useHistoryState(1));

      act(() => result.current[1](2));
      act(() => result.current[1](3));
      act(() => result.current[1](4));
      act(() => result.current[2].undo());
      act(() => result.current[2].undo());

      expect(result.current[2].future).toEqual([3, 4]);
    });

    test('should never go before the first value', () => {
      const { result } = renderHook(() => useHistoryState(1));

      act(() => result.current[1](2));
      act(() => result.current[2].undo(10));

      expect(result.current[0]).toBe(1);
      expect(result.current[2].history).toEqual([1]);
      expect(result.current[2].future).toEqual([2]);
    });

    test('should do nothing when there is only one value', () => {
      const { result } = renderHook(() => useHistoryState(1));
      const before = result.current[2].history;

      act(() => result.current[2].undo());

      expect(result.current[0]).toBe(1);
      expect(result.current[2].history).toBe(before);
    });

    test('should do nothing with an empty history', () => {
      const { result } = renderHook(() => useHistoryState<number>());

      act(() => result.current[2].undo());

      expect(result.current[0]).toBeUndefined();
      expect(result.current[2].history).toEqual([]);
    });

    test.each([0, -1, Number.NaN, 0.5])('should do nothing when the amount is %p', (amount) => {
      const { result } = renderHook(() => useHistoryState(1));

      act(() => result.current[1](2));
      act(() => result.current[2].undo(amount));

      expect(result.current[0]).toBe(2);
      expect(result.current[2].history).toEqual([1, 2]);
    });

    test('should go back as far as it can with an infinite amount', () => {
      const { result } = renderHook(() => useHistoryState(1));

      act(() => result.current[1](2));
      act(() => result.current[1](3));
      act(() => result.current[2].undo(Number.POSITIVE_INFINITY));

      expect(result.current[0]).toBe(1);
      expect(result.current[2].future).toEqual([2, 3]);
    });

    test('should apply several calls inside the same batch', () => {
      const { result } = renderHook(() => useHistoryState(1));

      act(() => result.current[1](2));
      act(() => result.current[1](3));
      act(() => {
        result.current[2].undo();
        result.current[2].undo();
      });

      expect(result.current[0]).toBe(1);
    });
  });

  describe('redo()', () => {
    test('should restore the undone value', () => {
      const { result } = renderHook(() => useHistoryState(1));

      act(() => result.current[1](2));
      act(() => result.current[2].undo());
      act(() => result.current[2].redo());

      expect(result.current[0]).toBe(2);
      expect(result.current[2].history).toEqual([1, 2]);
      expect(result.current[2].future).toEqual([]);
      expect(result.current[2].canRedo).toBe(false);
      expect(result.current[2].canUndo).toBe(true);
    });

    test('should go forward several steps', () => {
      const { result } = renderHook(() => useHistoryState(1));

      act(() => result.current[1](2));
      act(() => result.current[1](3));
      act(() => result.current[1](4));
      act(() => result.current[2].undo(3));
      act(() => result.current[2].redo(2));

      expect(result.current[0]).toBe(3);
      expect(result.current[2].history).toEqual([1, 2, 3]);
      expect(result.current[2].future).toEqual([4]);
    });

    test('should go forward as far as it can', () => {
      const { result } = renderHook(() => useHistoryState(1));

      act(() => result.current[1](2));
      act(() => result.current[2].undo());
      act(() => result.current[2].redo(10));

      expect(result.current[0]).toBe(2);
      expect(result.current[2].future).toEqual([]);
    });

    test('should do nothing when there is nothing to redo', () => {
      const { result } = renderHook(() => useHistoryState(1));
      const before = result.current[2].history;

      act(() => result.current[2].redo());

      expect(result.current[0]).toBe(1);
      expect(result.current[2].history).toBe(before);
    });

    test.each([0, -1, Number.NaN, 0.5])('should do nothing when the amount is %p', (amount) => {
      const { result } = renderHook(() => useHistoryState(1));

      act(() => result.current[1](2));
      act(() => result.current[2].undo());
      act(() => result.current[2].redo(amount));

      expect(result.current[0]).toBe(1);
      expect(result.current[2].future).toEqual([2]);
    });

    test('should work again after undoing and redoing several times', () => {
      const { result } = renderHook(() => useHistoryState(1));

      act(() => result.current[1](2));
      act(() => result.current[1](3));

      for (let round = 0; round < 3; round++) {
        act(() => result.current[2].undo(2));
        expect(result.current[0]).toBe(1);

        act(() => result.current[2].redo(2));
        expect(result.current[0]).toBe(3);
      }

      expect(result.current[2].history).toEqual([1, 2, 3]);
    });
  });

  describe('canUndo and canRedo', () => {
    test('should follow the position in the history', () => {
      const { result } = renderHook(() => useHistoryState(1));

      act(() => result.current[1](2));
      expect(result.current[2]).toMatchObject({ canUndo: true, canRedo: false });

      act(() => result.current[2].undo());
      expect(result.current[2]).toMatchObject({ canUndo: false, canRedo: true });

      act(() => result.current[2].redo());
      expect(result.current[2]).toMatchObject({ canUndo: true, canRedo: false });
    });
  });

  describe('identity', () => {
    test('setState, undo and redo should be stable between renders', () => {
      const { result, rerender } = renderHook(() => useHistoryState(1));
      const [, setState, { undo, redo }] = result.current;

      act(() => setState(2));
      rerender();

      expect(result.current[1]).toBe(setState);
      expect(result.current[2].undo).toBe(undo);
      expect(result.current[2].redo).toBe(redo);
    });

    test('future should be a new array on every change and never mutate the old one', () => {
      const { result } = renderHook(() => useHistoryState(1));

      act(() => result.current[1](2));
      act(() => result.current[2].undo());
      const before = result.current[2].future;

      act(() => result.current[2].redo());

      expect(result.current[2].future).not.toBe(before);
      expect(before).toEqual([2]);
    });
  });
});
