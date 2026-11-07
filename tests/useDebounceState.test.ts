import { afterEach, describe, expect, test, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useDebounceState } from '../src/useDebounceState';

vi.useFakeTimers();

function advance(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

describe('useDebounceState()', () => {
  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('initial value', () => {
    test('should start with the given value', () => {
      const { result } = renderHook(() => useDebounceState('initial', 500));

      expect(result.current[0]).toBe('initial');
    });

    test('should accept a lazy initial value', () => {
      const { result } = renderHook(() => useDebounceState(() => 'lazy', 500));

      expect(result.current[0]).toBe('lazy');
    });

    test('should resolve a lazy initial value only once', () => {
      const factory = vi.fn(() => 'lazy');
      const { rerender } = renderHook(() => useDebounceState(factory, 500));

      rerender();

      expect(factory).toHaveBeenCalledTimes(1);
    });

    test('should not be pending at first', () => {
      const { result } = renderHook(() => useDebounceState('initial', 500));

      expect(result.current[2].isPending).toBe(false);
    });
  });

  describe('setState()', () => {
    test('should not change the value immediately', () => {
      const { result } = renderHook(() => useDebounceState('initial', 500));

      act(() => result.current[1]('next'));

      expect(result.current[0]).toBe('initial');
    });

    test('should change the value after the delay', () => {
      const { result } = renderHook(() => useDebounceState('initial', 500));

      act(() => result.current[1]('next'));
      advance(500);

      expect(result.current[0]).toBe('next');
    });

    test('should not change the value before the delay is over', () => {
      const { result } = renderHook(() => useDebounceState('initial', 500));

      act(() => result.current[1]('next'));
      advance(499);

      expect(result.current[0]).toBe('initial');
    });

    test('should use a delay of 500ms by default', () => {
      const { result } = renderHook(() => useDebounceState('initial'));

      act(() => result.current[1]('next'));
      advance(499);
      expect(result.current[0]).toBe('initial');

      advance(1);
      expect(result.current[0]).toBe('next');
    });

    test('should restart the delay when called again before it is over', () => {
      const { result } = renderHook(() => useDebounceState('initial', 500));

      act(() => result.current[1]('first'));
      advance(200);
      act(() => result.current[1]('second'));
      advance(499);

      expect(result.current[0]).toBe('initial');

      advance(1);

      expect(result.current[0]).toBe('second');
    });

    test('should apply only the last value when called several times', () => {
      const { result } = renderHook(() => useDebounceState('initial', 500));

      act(() => {
        result.current[1]('first');
        result.current[1]('second');
        result.current[1]('third');
      });
      advance(500);

      expect(result.current[0]).toBe('third');
    });

    test('should keep only one timer running', () => {
      const { result } = renderHook(() => useDebounceState('initial', 500));

      act(() => {
        result.current[1]('first');
        result.current[1]('second');
      });

      expect(vi.getTimerCount()).toBe(1);
    });

    test('should accept an updater that receives the current value when the timer fires', () => {
      const { result } = renderHook(() => useDebounceState(1, 100));

      act(() => result.current[1]((prev) => prev + 1));
      advance(100);

      expect(result.current[0]).toBe(2);
    });

    test('should apply only the last updater when called several times', () => {
      const { result } = renderHook(() => useDebounceState(1, 100));

      act(() => {
        result.current[1]((prev) => prev + 1);
        result.current[1]((prev) => prev + 10);
      });
      advance(100);

      expect(result.current[0]).toBe(11);
    });

    test('should apply updates again after a previous one was applied', () => {
      const { result } = renderHook(() => useDebounceState('initial', 100));

      act(() => result.current[1]('first'));
      advance(100);
      act(() => result.current[1]('second'));
      advance(100);

      expect(result.current[0]).toBe('second');
    });

    test('should work with a delay of 0', () => {
      const { result } = renderHook(() => useDebounceState('initial', 0));

      act(() => result.current[1]('next'));
      expect(result.current[0]).toBe('initial');

      advance(0);
      expect(result.current[0]).toBe('next');
    });

    test('should use the delay of the render in which it was called', () => {
      const { result, rerender } = renderHook(({ delay }) => useDebounceState('initial', delay), {
        initialProps: { delay: 100 },
      });

      rerender({ delay: 300 });
      act(() => result.current[1]('next'));
      advance(100);
      expect(result.current[0]).toBe('initial');

      advance(200);
      expect(result.current[0]).toBe('next');
    });
  });

  describe('isPending', () => {
    test('should be true while an update waits for the delay', () => {
      const { result } = renderHook(() => useDebounceState('initial', 500));

      act(() => result.current[1]('next'));

      expect(result.current[2].isPending).toBe(true);
    });

    test('should stay true when the delay restarts', () => {
      const { result } = renderHook(() => useDebounceState('initial', 500));

      act(() => result.current[1]('first'));
      advance(100);
      act(() => result.current[1]('second'));

      expect(result.current[2].isPending).toBe(true);
    });

    test('should be false after the update is applied', () => {
      const { result } = renderHook(() => useDebounceState('initial', 500));

      act(() => result.current[1]('next'));
      advance(500);

      expect(result.current[2].isPending).toBe(false);
    });
  });

  describe('cancel()', () => {
    test('should drop the pending update', () => {
      const { result } = renderHook(() => useDebounceState('initial', 500));

      act(() => result.current[1]('next'));
      act(() => result.current[2].cancel());
      advance(1000);

      expect(result.current[0]).toBe('initial');
      expect(result.current[2].isPending).toBe(false);
    });

    test('should clear the timer', () => {
      const { result } = renderHook(() => useDebounceState('initial', 500));

      act(() => result.current[1]('next'));
      act(() => result.current[2].cancel());

      expect(vi.getTimerCount()).toBe(0);
    });

    test('should do nothing when there is no pending update', () => {
      const { result } = renderHook(() => useDebounceState('initial', 500));

      act(() => result.current[2].cancel());

      expect(result.current[0]).toBe('initial');
      expect(result.current[2].isPending).toBe(false);
    });

    test('should allow new updates afterwards', () => {
      const { result } = renderHook(() => useDebounceState('initial', 500));

      act(() => result.current[1]('dropped'));
      act(() => result.current[2].cancel());
      act(() => result.current[1]('kept'));
      advance(500);

      expect(result.current[0]).toBe('kept');
    });
  });

  describe('flush()', () => {
    test('should apply the pending update immediately', () => {
      const { result } = renderHook(() => useDebounceState('initial', 500));

      act(() => result.current[1]('next'));
      act(() => result.current[2].flush());

      expect(result.current[0]).toBe('next');
      expect(result.current[2].isPending).toBe(false);
    });

    test('should clear the timer so the update is not applied twice', () => {
      const { result } = renderHook(() => useDebounceState(1, 500));

      act(() => result.current[1]((prev) => prev + 1));
      act(() => result.current[2].flush());

      expect(vi.getTimerCount()).toBe(0);

      advance(1000);

      expect(result.current[0]).toBe(2);
    });

    test('should do nothing when there is no pending update', () => {
      const { result } = renderHook(() => useDebounceState('initial', 500));

      act(() => result.current[2].flush());

      expect(result.current[0]).toBe('initial');
      expect(result.current[2].isPending).toBe(false);
    });
  });

  describe('unmount', () => {
    test('should clear the pending timer', () => {
      const { result, unmount } = renderHook(() => useDebounceState('initial', 500));

      act(() => result.current[1]('next'));
      unmount();

      expect(vi.getTimerCount()).toBe(0);
    });
  });

  describe('identity', () => {
    test('setState, cancel and flush should be stable even when the delay changes', () => {
      const { result, rerender } = renderHook(({ delay }) => useDebounceState('initial', delay), {
        initialProps: { delay: 100 },
      });
      const [, setState, { cancel, flush }] = result.current;

      rerender({ delay: 200 });

      expect(result.current[1]).toBe(setState);
      expect(result.current[2].cancel).toBe(cancel);
      expect(result.current[2].flush).toBe(flush);
    });
  });
});
