import { describe, expect, test, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useImmutableState } from '../src/useImmutableState';

describe('useImmutableState()', () => {
  test('should return the given value', () => {
    const { result } = renderHook(() => useImmutableState('Richard'));

    expect(result.current).toBe('Richard');
  });

  test.each([[0], [''], [false], [null], [undefined]])('should keep the falsy value %p', (value) => {
    const { result } = renderHook(() => useImmutableState(value));

    expect(result.current).toBe(value);
  });

  test('should keep the same object reference between renders', () => {
    const value = { id: 1 };
    const { result, rerender } = renderHook(() => useImmutableState(value));

    rerender();

    expect(result.current).toBe(value);
  });

  test('should resolve a lazy value', () => {
    const { result } = renderHook(() => useImmutableState(() => 'lazy'));

    expect(result.current).toBe('lazy');
  });

  test('should resolve a lazy value only once', () => {
    const factory = vi.fn(() => ({ id: 1 }));
    const { result, rerender } = renderHook(() => useImmutableState(factory));
    const first = result.current;

    rerender();
    rerender();

    expect(factory).toHaveBeenCalledTimes(1);
    expect(result.current).toBe(first);
  });

  test('should ignore later values', () => {
    const { result, rerender } = renderHook(({ value }) => useImmutableState(value), {
      initialProps: { value: 'first' },
    });

    rerender({ value: 'second' });

    expect(result.current).toBe('first');
  });
});
