import { act, renderHook } from '@testing-library/react';
import useNumberState from '../src/useNumberState';

describe('useNumberState()', () => {
  test('initialValue', () => {
    const { result } = renderHook(() => useNumberState(0));

    expect(result.current[0]).toEqual(0);
  });

  test('setState() should update the state value', () => {
    const { result } = renderHook(() => useNumberState());
    const [, setState] = result.current;

    act(() => setState(5));

    expect(result.current[0]).toEqual(5);
  });

  test('setState() should update the state and check min value', () => {
    const { result } = renderHook(() => useNumberState(10, { min: 5 }));
    const [, setState] = result.current;

    act(() => setState(0));

    expect(result.current[0]).toEqual(5);
  });

  test('setState() should update the state and check max value', () => {
    const { result } = renderHook(() => useNumberState(0, { max: 5 }));
    const [, setState] = result.current;

    act(() => setState(10));

    expect(result.current[0]).toEqual(5);
  });

  test('setState() should update the state based on step', () => {
    const { result } = renderHook(() => useNumberState(0, { step: 5 }));
    const [, setState] = result.current;

    act(() => setState(8));

    expect(result.current[0]).toEqual(5);
  });

  test('inc() should increment state value', () => {
    const { result } = renderHook(() => useNumberState(0));
    const [, , { inc }] = result.current;

    act(() => inc(5));

    expect(result.current[0]).toEqual(5);
  });

  test('inc() should increment state and check max value', () => {
    const { result } = renderHook(() => useNumberState(0, { max: 5 }));
    const [, , { inc }] = result.current;

    act(() => inc(10));

    expect(result.current[0]).toEqual(5);
  });

  test('dec() should decrement state value', () => {
    const { result } = renderHook(() => useNumberState(5));
    const [, , { dec }] = result.current;

    act(() => dec(5));

    expect(result.current[0]).toEqual(0);
  });

  test('dec() should decrement state and check min value', () => {
    const { result } = renderHook(() => useNumberState(10, { min: 5 }));
    const [, , { dec }] = result.current;

    act(() => dec(10));

    expect(result.current[0]).toEqual(5);
  });
});
