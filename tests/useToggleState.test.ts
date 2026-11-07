import { describe, expect, test, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useToggleState } from '../src/useToggleState';

describe('useToggleState()', () => {
  describe('initial value', () => {
    test('should default to false', () => {
      const { result } = renderHook(() => useToggleState());

      expect(result.current[0]).toBe(false);
    });

    test.each([true, false])('should start as %p', (initial) => {
      const { result } = renderHook(() => useToggleState(initial));

      expect(result.current[0]).toBe(initial);
    });

    test('should accept a lazy initial value', () => {
      const { result } = renderHook(() => useToggleState(() => true));

      expect(result.current[0]).toBe(true);
    });

    test('should resolve a lazy initial value only once', () => {
      const factory = vi.fn(() => true);
      const { rerender } = renderHook(() => useToggleState(factory));

      rerender();

      expect(factory).toHaveBeenCalledTimes(1);
    });

    test('should ignore a changed initial value after mount', () => {
      const { result, rerender } = renderHook(({ initial }) => useToggleState(initial), {
        initialProps: { initial: false },
      });

      rerender({ initial: true });

      expect(result.current[0]).toBe(false);
    });
  });

  describe('toggle()', () => {
    test('should set the state to false when true', () => {
      const { result } = renderHook(() => useToggleState(true));

      act(() => result.current[1]());

      expect(result.current[0]).toBe(false);
    });

    test('should set the state to true when false', () => {
      const { result } = renderHook(() => useToggleState(false));

      act(() => result.current[1]());

      expect(result.current[0]).toBe(true);
    });

    test('should flip back and forth on repeated calls', () => {
      const { result } = renderHook(() => useToggleState(false));

      act(() => result.current[1]());
      act(() => result.current[1]());
      act(() => result.current[1]());

      expect(result.current[0]).toBe(true);
    });

    test('should flip once per call inside the same batch', () => {
      const { result } = renderHook(() => useToggleState(false));

      act(() => {
        result.current[1]();
        result.current[1]();
      });

      expect(result.current[0]).toBe(false);
    });

    test('toggle(true) should set the state to true, whatever it was', () => {
      const { result } = renderHook(() => useToggleState(false));

      act(() => result.current[1](true));
      expect(result.current[0]).toBe(true);

      act(() => result.current[1](true));
      expect(result.current[0]).toBe(true);
    });

    test('toggle(false) should set the state to false, whatever it was', () => {
      const { result } = renderHook(() => useToggleState(true));

      act(() => result.current[1](false));
      expect(result.current[0]).toBe(false);

      act(() => result.current[1](false));
      expect(result.current[0]).toBe(false);
    });

    test.each([['true'], [1], [0], [null], [{ type: 'click' }], [[]]])(
      'should ignore the non-boolean argument %p and just flip',
      (argument) => {
        const { result } = renderHook(() => useToggleState(false));

        act(() => result.current[1](argument));

        expect(result.current[0]).toBe(true);
      },
    );

    test('should keep its identity between renders', () => {
      const { result, rerender } = renderHook(() => useToggleState());
      const toggle = result.current[1];

      rerender();
      act(() => toggle());

      expect(result.current[1]).toBe(toggle);
    });
  });
});
