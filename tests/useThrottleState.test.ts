import { afterEach, describe, expect, test, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useThrottleState } from '../src/useThrottleState';

vi.useFakeTimers();

function advance(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

describe('useThrottleState()', () => {
  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('initial value', () => {
    test('should start with the given value', () => {
      const { result } = renderHook(() => useThrottleState('initial', 100));

      expect(result.current[0]).toBe('initial');
    });

    test('should accept a lazy initial value', () => {
      const { result } = renderHook(() => useThrottleState(() => 'lazy', 100));

      expect(result.current[0]).toBe('lazy');
    });

    test('should resolve a lazy initial value only once', () => {
      const factory = vi.fn(() => 'lazy');
      const { rerender } = renderHook(() => useThrottleState(factory, 100));

      rerender();

      expect(factory).toHaveBeenCalledTimes(1);
    });

    test('should not be pending at first', () => {
      const { result } = renderHook(() => useThrottleState('initial', 100));

      expect(result.current[2].isPending).toBe(false);
    });
  });

  describe('leading and trailing (defaults)', () => {
    test('should apply the first update right away', () => {
      const { result } = renderHook(() => useThrottleState(0, 100));

      act(() => result.current[1](1));

      expect(result.current[0]).toBe(1);
      expect(result.current[2].isPending).toBe(false);
    });

    test('should hold the updates made during the interval', () => {
      const { result } = renderHook(() => useThrottleState(0, 100));

      act(() => result.current[1](1));
      act(() => result.current[1](2));

      expect(result.current[0]).toBe(1);
      expect(result.current[2].isPending).toBe(true);
    });

    test('should apply only the last held update when the interval ends', () => {
      const { result } = renderHook(() => useThrottleState(0, 100));

      act(() => result.current[1](1));
      act(() => {
        result.current[1](2);
        result.current[1](3);
      });
      advance(99);
      expect(result.current[0]).toBe(1);

      advance(1);
      expect(result.current[0]).toBe(3);
      expect(result.current[2].isPending).toBe(false);
    });

    test('should start a new interval after applying a held update', () => {
      const { result } = renderHook(() => useThrottleState(0, 100));

      act(() => result.current[1](1)); // applied now, interval A (0-100ms)
      act(() => result.current[1](2)); // held
      advance(100); // 2 applied, interval B starts (100-200ms)
      expect(result.current[0]).toBe(2);

      act(() => result.current[1](3)); // held by interval B
      expect(result.current[0]).toBe(2);

      advance(100);
      expect(result.current[0]).toBe(3);
    });

    test('should keep applying at most once per interval while calls continue', () => {
      const { result } = renderHook(() => useThrottleState(0, 100));
      const seen: number[] = [];

      for (let value = 1; value <= 10; value++) {
        act(() => result.current[1](value));
        seen.push(result.current[0]);
        advance(30);
      }
      advance(100);

      // 1 right away, then held ones applied when each interval ends
      expect(seen[0]).toBe(1);
      expect(result.current[0]).toBe(10);
      expect(new Set(seen).size).toBeLessThan(10);
    });

    test('should apply a new first update right away once the interval is over', () => {
      const { result } = renderHook(() => useThrottleState(0, 100));

      act(() => result.current[1](1));
      advance(100);
      act(() => result.current[1](2));

      expect(result.current[0]).toBe(2);
    });

    test('should end the interval when nothing was held', () => {
      const { result } = renderHook(() => useThrottleState(0, 100));

      act(() => result.current[1](1));
      advance(100);

      expect(vi.getTimerCount()).toBe(0);
    });

    test('should accept updater functions that receive the current value', () => {
      const { result } = renderHook(() => useThrottleState(1, 100));

      act(() => result.current[1]((prev) => prev + 1));
      expect(result.current[0]).toBe(2);

      act(() => result.current[1]((prev) => prev + 10));
      advance(100);

      expect(result.current[0]).toBe(12);
    });

    test('should apply only the last updater when several are held', () => {
      const { result } = renderHook(() => useThrottleState(0, 100));

      act(() => result.current[1](1));
      act(() => {
        result.current[1]((prev) => prev + 1);
        result.current[1]((prev) => prev + 10);
      });
      advance(100);

      expect(result.current[0]).toBe(11);
    });

    test('should use an interval of 500ms by default', () => {
      const { result } = renderHook(() => useThrottleState(0));

      act(() => result.current[1](1));
      act(() => result.current[1](2));
      advance(499);
      expect(result.current[0]).toBe(1);

      advance(1);
      expect(result.current[0]).toBe(2);
    });

    test('should work with an interval of 0', () => {
      const { result } = renderHook(() => useThrottleState(0, 0));

      act(() => result.current[1](1));
      act(() => result.current[1](2));
      expect(result.current[0]).toBe(1);

      advance(0);
      expect(result.current[0]).toBe(2);
    });
  });

  describe('leading: false', () => {
    test('should hold even the first update until the interval ends', () => {
      const { result } = renderHook(() => useThrottleState(0, 100, { leading: false }));

      act(() => result.current[1](1));
      expect(result.current[0]).toBe(0);
      expect(result.current[2].isPending).toBe(true);

      advance(100);
      expect(result.current[0]).toBe(1);
      expect(result.current[2].isPending).toBe(false);
    });

    test('should apply only the last update', () => {
      const { result } = renderHook(() => useThrottleState(0, 100, { leading: false }));

      act(() => {
        result.current[1](1);
        result.current[1](2);
      });
      advance(100);

      expect(result.current[0]).toBe(2);
    });
  });

  describe('trailing: false', () => {
    test('should apply the first update and drop the ones made during the interval', () => {
      const { result } = renderHook(() => useThrottleState(0, 100, { trailing: false }));

      act(() => result.current[1](1));
      act(() => result.current[1](2));
      expect(result.current[2].isPending).toBe(false);

      advance(100);

      expect(result.current[0]).toBe(1);
    });

    test('should apply a new update once the interval is over', () => {
      const { result } = renderHook(() => useThrottleState(0, 100, { trailing: false }));

      act(() => result.current[1](1));
      act(() => result.current[1](2));
      advance(100);
      act(() => result.current[1](3));

      expect(result.current[0]).toBe(3);
    });
  });

  describe('leading: false and trailing: false', () => {
    test('should never apply anything', () => {
      const { result } = renderHook(() => useThrottleState(0, 100, { leading: false, trailing: false }));

      act(() => result.current[1](1));
      advance(1000);

      expect(result.current[0]).toBe(0);
      expect(result.current[2].isPending).toBe(false);
    });
  });

  describe('options', () => {
    test('should use the options of the render in which the setter is called', () => {
      const { result, rerender } = renderHook(({ interval, leading }) => useThrottleState(0, interval, { leading }), {
        initialProps: { interval: 100, leading: true },
      });

      rerender({ interval: 300, leading: false });
      act(() => result.current[1](1));
      expect(result.current[0]).toBe(0);

      advance(299);
      expect(result.current[0]).toBe(0);

      advance(1);
      expect(result.current[0]).toBe(1);
    });

    test('should accept explicitly undefined options', () => {
      const { result } = renderHook(() => useThrottleState(0, 100, { leading: undefined, trailing: undefined }));

      act(() => result.current[1](1));
      act(() => result.current[1](2));
      advance(100);

      expect(result.current[0]).toBe(2);
    });
  });

  describe('cancel()', () => {
    test('should drop the held update', () => {
      const { result } = renderHook(() => useThrottleState(0, 100));

      act(() => result.current[1](1));
      act(() => result.current[1](2));
      act(() => result.current[2].cancel());
      advance(1000);

      expect(result.current[0]).toBe(1);
      expect(result.current[2].isPending).toBe(false);
    });

    test('should end the interval so the next update is applied right away', () => {
      const { result } = renderHook(() => useThrottleState(0, 100));

      act(() => result.current[1](1));
      act(() => result.current[2].cancel());
      act(() => result.current[1](2));

      expect(result.current[0]).toBe(2);
    });

    test('should clear the timer', () => {
      const { result } = renderHook(() => useThrottleState(0, 100));

      act(() => result.current[1](1));
      act(() => result.current[2].cancel());

      expect(vi.getTimerCount()).toBe(0);
    });

    test('should do nothing when nothing is held', () => {
      const { result } = renderHook(() => useThrottleState(0, 100));

      act(() => result.current[2].cancel());

      expect(result.current[0]).toBe(0);
      expect(result.current[2].isPending).toBe(false);
    });
  });

  describe('flush()', () => {
    test('should apply the held update immediately', () => {
      const { result } = renderHook(() => useThrottleState(0, 100));

      act(() => result.current[1](1));
      act(() => result.current[1](2));
      act(() => result.current[2].flush());

      expect(result.current[0]).toBe(2);
      expect(result.current[2].isPending).toBe(false);
    });

    test('should end the interval so the update is not applied twice', () => {
      const { result } = renderHook(() => useThrottleState(0, 100));

      act(() => result.current[1](1));
      act(() => result.current[1]((prev) => prev + 1));
      act(() => result.current[2].flush());

      expect(vi.getTimerCount()).toBe(0);

      advance(1000);

      expect(result.current[0]).toBe(2);
    });

    test('should do nothing when nothing is held', () => {
      const { result } = renderHook(() => useThrottleState(0, 100));

      act(() => result.current[2].flush());

      expect(result.current[0]).toBe(0);
      expect(result.current[2].isPending).toBe(false);
    });

    test('should apply the first update held by leading: false', () => {
      const { result } = renderHook(() => useThrottleState(0, 100, { leading: false }));

      act(() => result.current[1](1));
      act(() => result.current[2].flush());

      expect(result.current[0]).toBe(1);
    });
  });

  describe('unmount', () => {
    test('should clear the timer', () => {
      const { result, unmount } = renderHook(() => useThrottleState(0, 100));

      act(() => result.current[1](1));
      act(() => result.current[1](2));
      unmount();

      expect(vi.getTimerCount()).toBe(0);
    });
  });

  describe('identity', () => {
    test('setState, cancel and flush should be stable even when the options change', () => {
      const { result, rerender } = renderHook(
        ({ interval }) => useThrottleState(0, interval, { leading: interval > 100 }),
        {
          initialProps: { interval: 100 },
        },
      );
      const [, setState, { cancel, flush }] = result.current;

      rerender({ interval: 200 });

      expect(result.current[1]).toBe(setState);
      expect(result.current[2].cancel).toBe(cancel);
      expect(result.current[2].flush).toBe(flush);
    });
  });
});
