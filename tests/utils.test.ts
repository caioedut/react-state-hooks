import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { areDepsEqual, countDecimals, createAbortController, resolveInitializer, resolveUpdater } from '../src/utils';

describe('resolveInitializer()', () => {
  test('should return plain values as they are', () => {
    expect(resolveInitializer(1)).toBe(1);
    expect(resolveInitializer('text')).toBe('text');
    expect(resolveInitializer(null)).toBeNull();
    expect(resolveInitializer(undefined)).toBeUndefined();
  });

  test('should return the same reference for objects', () => {
    const value = { id: 1 };

    expect(resolveInitializer(value)).toBe(value);
  });

  test('should call functions and return their result', () => {
    expect(resolveInitializer(() => 'lazy')).toBe('lazy');
  });

  test('should call the function only once per resolution', () => {
    const factory = vi.fn(() => 1);

    resolveInitializer(factory);

    expect(factory).toHaveBeenCalledTimes(1);
  });
});

describe('resolveUpdater()', () => {
  test('should return plain values as they are', () => {
    expect(resolveUpdater(2, 1)).toBe(2);
    expect(resolveUpdater<number | null>(null, 1)).toBeNull();
  });

  test('should call updaters with the previous value', () => {
    const updater = vi.fn((previous: number) => previous + 1);

    expect(resolveUpdater(updater, 1)).toBe(2);
    expect(updater).toHaveBeenCalledWith(1);
  });
});

describe('areDepsEqual()', () => {
  test('should be true for empty lists', () => {
    expect(areDepsEqual([], [])).toBe(true);
  });

  test('should be true when every item is the same', () => {
    const object = {};

    expect(areDepsEqual([1, 'a', object], [1, 'a', object])).toBe(true);
  });

  test('should be false when an item differs', () => {
    expect(areDepsEqual([1, 2], [1, 3])).toBe(false);
  });

  test('should compare by reference, not by value', () => {
    expect(areDepsEqual([{}], [{}])).toBe(false);
  });

  test('should be false when the lists have different sizes', () => {
    expect(areDepsEqual([1], [1, 2])).toBe(false);
    expect(areDepsEqual([1, 2], [1])).toBe(false);
  });

  test('should use Object.is semantics', () => {
    expect(areDepsEqual([Number.NaN], [Number.NaN])).toBe(true);
    expect(areDepsEqual([0], [-0])).toBe(false);
  });
});

describe('countDecimals()', () => {
  test.each([
    [0, 0],
    [1, 0],
    [-5, 0],
    [0.1, 1],
    [0.25, 2],
    [-1.125, 3],
    [1e-7, 7],
    [1.5e-7, 8],
    [-2.5e-7, 8],
    [1e21, 0],
    [1.5e21, 0],
    [1e-200, 100],
    [Number.NaN, 0],
    [Number.POSITIVE_INFINITY, 0],
    [Number.NEGATIVE_INFINITY, 0],
  ])('countDecimals(%p) should be %p', (value, expected) => {
    expect(countDecimals(value)).toBe(expected);
  });
});

describe('createAbortController()', () => {
  const NativeAbortController = globalThis.AbortController;

  afterEach(() => {
    globalThis.AbortController = NativeAbortController;
  });

  describe('with a platform AbortController', () => {
    test('should return a signal that is not aborted', () => {
      const { signal } = createAbortController();

      expect(signal.aborted).toBe(false);
    });

    test('should abort the signal', () => {
      const { signal, abort } = createAbortController();
      const listener = vi.fn();
      signal.addEventListener('abort', listener);

      abort();

      expect(signal.aborted).toBe(true);
      expect(listener).toHaveBeenCalledTimes(1);
    });

    test('should use the platform implementation', () => {
      const { signal } = createAbortController();

      expect(signal).toBeInstanceOf(AbortSignal);
    });
  });

  describe('without a platform AbortController', () => {
    beforeEach(() => {
      // @ts-expect-error simulating a runtime that has no AbortController
      delete globalThis.AbortController;
    });

    test('should not throw', () => {
      expect(() => createAbortController()).not.toThrow();
    });

    test('should return a signal that is not aborted', () => {
      const { signal } = createAbortController();

      expect(signal.aborted).toBe(false);
      expect(signal.reason).toBeUndefined();
      expect(() => signal.throwIfAborted()).not.toThrow();
    });

    test('should abort the signal and keep a reason', () => {
      const { signal, abort } = createAbortController();

      abort();

      expect(signal.aborted).toBe(true);
      expect(signal.reason).toBeInstanceOf(Error);
      expect(() => signal.throwIfAborted()).toThrow();
    });

    test('should call abort listeners once, even when aborted twice', () => {
      const { signal, abort } = createAbortController();
      const listener = vi.fn();
      signal.addEventListener('abort', listener);

      abort();
      abort();

      expect(listener).toHaveBeenCalledTimes(1);
    });

    test('should call onabort', () => {
      const { signal, abort } = createAbortController();
      const onabort = vi.fn();
      // The `onabort` property itself is what is being tested here
      // oxlint-disable-next-line unicorn/prefer-add-event-listener
      signal.onabort = onabort;

      abort();

      expect(onabort).toHaveBeenCalledTimes(1);
    });

    test('should not call a listener that was removed', () => {
      const { signal, abort } = createAbortController();
      const listener = vi.fn();
      signal.addEventListener('abort', listener);
      signal.removeEventListener('abort', listener);

      abort();

      expect(listener).not.toHaveBeenCalled();
    });

    test('should ignore listeners for other events', () => {
      const { signal, abort } = createAbortController();
      const listener = vi.fn();
      signal.addEventListener('other', listener);
      signal.removeEventListener('other', listener);

      abort();

      expect(listener).not.toHaveBeenCalled();
    });

    test('should have a dispatchEvent that does nothing', () => {
      const { signal } = createAbortController();

      expect(signal.dispatchEvent(new Event('abort'))).toBe(false);
    });
  });
});
