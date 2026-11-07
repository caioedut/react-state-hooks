import { describe, expect, test, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useStoreState } from '../src/useStoreState';
import { uniqueKey } from './helpers';

describe('useStoreState()', () => {
  describe('initial value', () => {
    test('should start with the initial state', () => {
      const key = uniqueKey();

      const { result } = renderHook(() => useStoreState(key, 'Richard'));

      expect(result.current[0]).toBe('Richard');
    });

    test('should accept a lazy initial state', () => {
      const key = uniqueKey();

      const { result } = renderHook(() => useStoreState(key, () => 'Richard'));

      expect(result.current[0]).toBe('Richard');
    });

    test('should resolve a lazy initial state only once per key', () => {
      const key = uniqueKey();
      const factory = vi.fn(() => 'Richard');

      const { rerender } = renderHook(() => useStoreState(key, factory));
      renderHook(() => useStoreState(key, factory));
      rerender();

      expect(factory).toHaveBeenCalledTimes(1);
    });

    test('should be undefined without initial state', () => {
      const key = uniqueKey();

      const { result } = renderHook(() => useStoreState<number>(key));

      expect(result.current[0]).toBeUndefined();
    });

    test('should not apply a later initial state when the first hook had none', () => {
      const key = uniqueKey();

      renderHook(() => useStoreState<string>(key));
      const { result } = renderHook(() => useStoreState(key, 'late'));

      expect(result.current[0]).toBeUndefined();
    });

    test.each([[0], [''], [false], [null]])('should keep the falsy initial state %p', (value) => {
      const key = uniqueKey();

      const { result } = renderHook(() => useStoreState<unknown>(key, value));

      expect(result.current[0]).toBe(value);
    });
  });

  describe('setState()', () => {
    test('should update the state value', () => {
      const key = uniqueKey();

      const { result } = renderHook(() => useStoreState(key, 'Richard'));

      act(() => result.current[1]('Ward'));

      expect(result.current[0]).toBe('Ward');
    });

    test('should accept an updater that receives the current value', () => {
      const key = uniqueKey();

      const { result } = renderHook(() => useStoreState(key, 0));

      act(() => result.current[1]((prev) => prev + 1));

      expect(result.current[0]).toBe(1);
    });

    test('should apply updaters sequentially inside the same batch', () => {
      const key = uniqueKey();

      const { result } = renderHook(() => useStoreState(key, 0));

      act(() => {
        result.current[1]((prev) => prev + 1);
        result.current[1]((prev) => prev + 1);
      });

      expect(result.current[0]).toBe(2);
    });

    test('should give the updater undefined when there is no initial state', () => {
      const key = uniqueKey();

      const updater = vi.fn(() => 1);
      const { result } = renderHook(() => useStoreState<number>(key));

      act(() => result.current[1](updater));

      expect(updater).toHaveBeenCalledWith(undefined);
    });

    test('should keep null as a valid value', () => {
      const key = uniqueKey();

      const { result } = renderHook(() => useStoreState<string | null>(key, null));

      expect(result.current[0]).toBeNull();

      act(() => result.current[1]('value'));
      expect(result.current[0]).toBe('value');

      act(() => result.current[1](null));
      expect(result.current[0]).toBeNull();
    });

    test('should not re-render when the value is unchanged', () => {
      const key = uniqueKey();
      let renders = 0;

      const { result } = renderHook(() => {
        renders++;
        return useStoreState(key, 1);
      });

      const before = renders;
      act(() => result.current[1](1));

      expect(renders).toBe(before);
    });

    test('should keep its identity between renders', () => {
      const key = uniqueKey();

      const { result, rerender } = renderHook(() => useStoreState(key, 0));
      const setState = result.current[1];

      act(() => setState(1));
      rerender();

      expect(result.current[1]).toBe(setState);
    });
  });

  describe('sharing', () => {
    test('should share the state between hooks with the same key', () => {
      const key = uniqueKey();
      const { result: resultA } = renderHook(() => useStoreState(key, 'Richard'));
      const { result: resultB } = renderHook(() => useStoreState(key, 'Richard'));

      act(() => resultA.current[1]('Ward'));

      expect(resultA.current[0]).toBe('Ward');
      expect(resultB.current[0]).toBe('Ward');
    });

    test('should let any hook update the shared state', () => {
      const key = uniqueKey();
      const { result: resultA } = renderHook(() => useStoreState(key, 0));
      const { result: resultB } = renderHook(() => useStoreState(key, 0));

      act(() => resultA.current[1]((prev) => prev + 1));
      act(() => resultB.current[1]((prev) => prev + 1));

      expect(resultA.current[0]).toBe(2);
      expect(resultB.current[0]).toBe(2);
    });

    test('should not share the state between different keys', () => {
      const keyA = uniqueKey();
      const keyB = uniqueKey();

      const { result: resultA } = renderHook(() => useStoreState(keyA, 'A'));
      const { result: resultB } = renderHook(() => useStoreState(keyB, 'B'));

      act(() => resultA.current[1]('changed'));

      expect(resultA.current[0]).toBe('changed');
      expect(resultB.current[0]).toBe('B');
    });

    test('should use the initial state of the first hook only', () => {
      const key = uniqueKey();

      renderHook(() => useStoreState(key, 'first'));
      const { result } = renderHook(() => useStoreState(key, 'second'));

      expect(result.current[0]).toBe('first');
    });

    test('should give a hook mounted later the current value', () => {
      const key = uniqueKey();
      const { result: resultA } = renderHook(() => useStoreState(key, 'initial'));

      act(() => resultA.current[1]('updated'));
      const { result: resultB } = renderHook(() => useStoreState(key, 'initial'));

      expect(resultB.current[0]).toBe('updated');
    });

    test('should keep the value after every hook unmounts', () => {
      const key = uniqueKey();
      const first = renderHook(() => useStoreState(key, 'initial'));

      act(() => first.result.current[1]('updated'));
      first.unmount();

      const { result } = renderHook(() => useStoreState(key, 'initial'));

      expect(result.current[0]).toBe('updated');
    });
  });

  describe('subscriptions', () => {
    test('should stop updating a hook after it unmounts', () => {
      const key = uniqueKey();
      const mounted = renderHook(() => useStoreState(key, 'Richard'));
      const unmounted = renderHook(() => useStoreState(key, 'Richard'));

      unmounted.unmount();
      act(() => mounted.result.current[1]('Ward'));

      expect(mounted.result.current[0]).toBe('Ward');
      expect(unmounted.result.current[0]).toBe('Richard');
    });

    test('should still allow the setter of an unmounted hook to update the store', () => {
      const key = uniqueKey();
      const mounted = renderHook(() => useStoreState(key, 'Richard'));
      const unmounted = renderHook(() => useStoreState(key, 'Richard'));
      const setState = unmounted.result.current[1];

      unmounted.unmount();
      act(() => setState('John'));

      expect(mounted.result.current[0]).toBe('John');
    });

    test('should re-render only the hooks of the changed key', () => {
      const keyA = uniqueKey();
      const keyB = uniqueKey();
      let rendersB = 0;

      const { result: resultA } = renderHook(() => useStoreState(keyA, 0));
      renderHook(() => {
        rendersB++;
        return useStoreState(keyB, 0);
      });

      const before = rendersB;
      act(() => resultA.current[1](1));

      expect(rendersB).toBe(before);
    });
  });

  describe('key changes', () => {
    test('should follow the new key when it changes', () => {
      const keyA = uniqueKey();
      const keyB = uniqueKey();

      const { result, rerender } = renderHook(({ storeKey }) => useStoreState(storeKey, storeKey), {
        initialProps: { storeKey: keyA },
      });

      expect(result.current[0]).toBe(keyA);

      rerender({ storeKey: keyB });
      expect(result.current[0]).toBe(keyB);

      act(() => result.current[1]('updated b'));
      rerender({ storeKey: keyA });
      expect(result.current[0]).toBe(keyA);

      rerender({ storeKey: keyB });
      expect(result.current[0]).toBe('updated b');
    });

    test('should update the setter to write to the new key', () => {
      const keyA = uniqueKey();
      const keyB = uniqueKey();

      const { result, rerender } = renderHook(({ storeKey }) => useStoreState(storeKey, 0), {
        initialProps: { storeKey: keyA },
      });
      const other = renderHook(() => useStoreState(keyB, 0));

      rerender({ storeKey: keyB });
      act(() => result.current[1](5));

      expect(other.result.current[0]).toBe(5);
    });

    test('should unsubscribe from the old key', () => {
      const keyA = uniqueKey();
      const keyB = uniqueKey();

      const { result, rerender } = renderHook(({ storeKey }) => useStoreState(storeKey, 0), {
        initialProps: { storeKey: keyA },
      });
      const other = renderHook(() => useStoreState(keyA, 0));

      rerender({ storeKey: keyB });
      act(() => other.result.current[1](9));

      expect(result.current[0]).toBe(0);
    });
  });
});
