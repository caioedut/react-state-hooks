import { describe, expect, test } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useNumberState } from '../src/useNumberState';

describe('useNumberState()', () => {
  describe('initial value', () => {
    test('should default to 0', () => {
      const { result } = renderHook(() => useNumberState());

      expect(result.current[0]).toBe(0);
    });

    test('should start with the given value', () => {
      const { result } = renderHook(() => useNumberState(7));

      expect(result.current[0]).toBe(7);
    });

    test('should respect min', () => {
      const { result } = renderHook(() => useNumberState(0, { min: 5 }));

      expect(result.current[0]).toBe(5);
    });

    test('should respect max', () => {
      const { result } = renderHook(() => useNumberState(100, { max: 10 }));

      expect(result.current[0]).toBe(10);
    });

    test('should respect step', () => {
      const { result } = renderHook(() => useNumberState(7, { step: 5 }));

      expect(result.current[0]).toBe(5);
    });
  });

  describe('setState()', () => {
    test('should update the state value', () => {
      const { result } = renderHook(() => useNumberState());

      act(() => result.current[1](5));

      expect(result.current[0]).toBe(5);
    });

    test('should accept an updater', () => {
      const { result } = renderHook(() => useNumberState(1));

      act(() => result.current[1]((prev) => prev + 1));

      expect(result.current[0]).toBe(2);
    });

    test('should apply updaters sequentially inside the same batch', () => {
      const { result } = renderHook(() => useNumberState(0));

      act(() => {
        result.current[1]((prev) => prev + 1);
        result.current[1]((prev) => prev + 1);
      });

      expect(result.current[0]).toBe(2);
    });

    test('should clamp values below min', () => {
      const { result } = renderHook(() => useNumberState(10, { min: 5 }));

      act(() => result.current[1](0));

      expect(result.current[0]).toBe(5);
    });

    test('should clamp values above max', () => {
      const { result } = renderHook(() => useNumberState(0, { max: 5 }));

      act(() => result.current[1](10));

      expect(result.current[0]).toBe(5);
    });

    test('should clamp the result of an updater', () => {
      const { result } = renderHook(() => useNumberState(4, { max: 5 }));

      act(() => result.current[1]((prev) => prev + 10));

      expect(result.current[0]).toBe(5);
    });

    test('should accept values equal to min and max', () => {
      const { result } = renderHook(() => useNumberState(5, { min: 0, max: 10 }));

      act(() => result.current[1](0));
      expect(result.current[0]).toBe(0);

      act(() => result.current[1](10));
      expect(result.current[0]).toBe(10);
    });

    test('should work when min equals max', () => {
      const { result } = renderHook(() => useNumberState(0, { min: 3, max: 3 }));

      act(() => result.current[1](100));

      expect(result.current[0]).toBe(3);
    });

    test('should floor to a multiple of step', () => {
      const { result } = renderHook(() => useNumberState(0, { step: 5 }));

      act(() => result.current[1](8));

      expect(result.current[0]).toBe(5);
    });

    test('should keep values that are already a multiple of step', () => {
      const { result } = renderHook(() => useNumberState(0, { step: 5 }));

      act(() => result.current[1](15));

      expect(result.current[0]).toBe(15);
    });

    test('should floor negative numbers towards minus infinity', () => {
      const { result } = renderHook(() => useNumberState(0, { step: 5 }));

      act(() => result.current[1](-3));

      expect(result.current[0]).toBe(-5);
    });

    test('should count step from min', () => {
      const { result } = renderHook(() => useNumberState(0, { min: 3, step: 5 }));

      act(() => result.current[1](14));

      expect(result.current[0]).toBe(13);
    });

    test('should count step from a fractional min', () => {
      const { result } = renderHook(() => useNumberState(0, { min: 0.5, step: 0.25 }));

      act(() => result.current[1](1.4));

      expect(result.current[0]).toBe(1.25);
    });

    test('should combine max and step', () => {
      const { result } = renderHook(() => useNumberState(0, { max: 7, step: 5 }));

      act(() => result.current[1](100));

      expect(result.current[0]).toBe(5);
    });

    test('should not lose a floating point value that is a multiple of step', () => {
      const { result } = renderHook(() => useNumberState(0, { step: 0.1 }));

      act(() => result.current[1](0.3));

      expect(result.current[0]).toBe(0.3);
    });

    test('should work with a very small step written in exponent notation', () => {
      const { result } = renderHook(() => useNumberState(0, { step: 1e-7 }));

      act(() => result.current[1](3e-7));

      expect(result.current[0]).toBe(3e-7);
    });

    test.each([0, -1])('should ignore an invalid step (%p)', (step) => {
      const { result } = renderHook(() => useNumberState(0, { step }));

      act(() => result.current[1](7.5));

      expect(result.current[0]).toBe(7.5);
    });

    test('should accept explicitly undefined options', () => {
      const { result } = renderHook(() => useNumberState(0, { min: undefined, max: undefined, step: undefined }));

      act(() => result.current[1](-42));

      expect(result.current[0]).toBe(-42);
    });

    test('should use the latest options', () => {
      const { result, rerender } = renderHook(({ max }) => useNumberState(0, { max }), {
        initialProps: { max: 5 },
      });

      rerender({ max: 50 });
      act(() => result.current[1](20));

      expect(result.current[0]).toBe(20);
    });
  });

  describe('inc()', () => {
    test('should increment by the given amount', () => {
      const { result } = renderHook(() => useNumberState(0));

      act(() => result.current[2].inc(5));

      expect(result.current[0]).toBe(5);
    });

    test('should increment by 1 by default', () => {
      const { result } = renderHook(() => useNumberState(0));

      act(() => result.current[2].inc());

      expect(result.current[0]).toBe(1);
    });

    test('should increment by step by default', () => {
      const { result } = renderHook(() => useNumberState(0, { step: 5 }));

      act(() => result.current[2].inc());
      act(() => result.current[2].inc());

      expect(result.current[0]).toBe(10);
    });

    test('should accept a negative amount', () => {
      const { result } = renderHook(() => useNumberState(5));

      act(() => result.current[2].inc(-2));

      expect(result.current[0]).toBe(3);
    });

    test('should respect max', () => {
      const { result } = renderHook(() => useNumberState(0, { max: 5 }));

      act(() => result.current[2].inc(10));

      expect(result.current[0]).toBe(5);
    });

    test('should accumulate calls inside the same batch', () => {
      const { result } = renderHook(() => useNumberState(0));

      act(() => {
        result.current[2].inc();
        result.current[2].inc();
        result.current[2].inc();
      });

      expect(result.current[0]).toBe(3);
    });

    test('should not accumulate floating point errors', () => {
      const { result } = renderHook(() => useNumberState(0, { step: 0.1 }));

      act(() => result.current[2].inc());
      act(() => result.current[2].inc());
      act(() => result.current[2].inc());

      expect(result.current[0]).toBe(0.3);
    });
  });

  describe('dec()', () => {
    test('should decrement by the given amount', () => {
      const { result } = renderHook(() => useNumberState(5));

      act(() => result.current[2].dec(5));

      expect(result.current[0]).toBe(0);
    });

    test('should decrement by 1 by default', () => {
      const { result } = renderHook(() => useNumberState(5));

      act(() => result.current[2].dec());

      expect(result.current[0]).toBe(4);
    });

    test('should decrement by step by default', () => {
      const { result } = renderHook(() => useNumberState(10, { step: 5 }));

      act(() => result.current[2].dec());

      expect(result.current[0]).toBe(5);
    });

    test('should respect min', () => {
      const { result } = renderHook(() => useNumberState(10, { min: 5 }));

      act(() => result.current[2].dec(10));

      expect(result.current[0]).toBe(5);
    });

    test('should go below zero when there is no min', () => {
      const { result } = renderHook(() => useNumberState(0));

      act(() => result.current[2].dec(3));

      expect(result.current[0]).toBe(-3);
    });
  });

  describe('identity', () => {
    test('setState, inc and dec should be stable even with inline options', () => {
      const { result, rerender } = renderHook(() => useNumberState(0, { min: 0, max: 10, step: 1 }));
      const [, setState, actions] = result.current;

      rerender();

      expect(result.current[1]).toBe(setState);
      expect(result.current[2].inc).toBe(actions.inc);
      expect(result.current[2].dec).toBe(actions.dec);
    });

    test('should change identity only when an option changes', () => {
      const { result, rerender } = renderHook(({ max }) => useNumberState(0, { max }), {
        initialProps: { max: 5 },
      });
      const first = result.current[1];

      rerender({ max: 5 });
      expect(result.current[1]).toBe(first);

      rerender({ max: 6 });
      expect(result.current[1]).not.toBe(first);
    });
  });
});
