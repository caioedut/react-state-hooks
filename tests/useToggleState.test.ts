import { act, renderHook } from '@testing-library/react';
import useToggleState from '../src/useToggleState';

describe('useToggleState()', () => {
  test('initialValue', () => {
    const { result } = renderHook(() => useToggleState(true));

    expect(result.current[0]).toEqual(true);
  });

  test('toggle() should set state to false when true', () => {
    const { result } = renderHook(() => useToggleState(true));
    const [, toggle] = result.current;

    act(() => toggle());

    expect(result.current[0]).toEqual(false);
  });

  test('toggle() should set state to true when false', () => {
    const { result } = renderHook(() => useToggleState(false));
    const [, toggle] = result.current;

    act(() => toggle());

    expect(result.current[0]).toEqual(true);
  });
});
