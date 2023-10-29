import { act, renderHook } from '@testing-library/react';
import useNumberState from '../src/useNumberState';

describe('useNumberState()', () => {
  test('initialValue', () => {
    const hook = renderHook(() => useNumberState(0));
    const [state] = hook.result.current;

    expect(state).toEqual(0);
  });

  test('setState() should update the state value', () => {
    const hook = renderHook(() => useNumberState());
    const [, setState] = hook.result.current;

    act(() => setState(5));

    expect(hook.result.current[0]).toEqual(5);
  });

  test('setState() should update the state and check min value', () => {
    const hook = renderHook(() => useNumberState(10, { min: 5 }));
    const [, setState] = hook.result.current;

    act(() => setState(0));

    expect(hook.result.current[0]).toEqual(5);
  });

  test('setState() should update the state and check max value', () => {
    const hook = renderHook(() => useNumberState(0, { max: 5 }));
    const [, setState] = hook.result.current;

    act(() => setState(10));

    expect(hook.result.current[0]).toEqual(5);
  });

  test('setState() should update the state based on step', () => {
    const hook = renderHook(() => useNumberState(0, { step: 5 }));
    const [, setState] = hook.result.current;

    act(() => setState(8));

    expect(hook.result.current[0]).toEqual(5);
  });

  test('inc() should increment state value', () => {
    const hook = renderHook(() => useNumberState(0));
    const [, , { inc }] = hook.result.current;

    act(() => inc(5));

    expect(hook.result.current[0]).toEqual(5);
  });

  test('inc() should increment state and check max value', () => {
    const hook = renderHook(() => useNumberState(0, { max: 5 }));
    const [, , { inc }] = hook.result.current;

    act(() => inc(10));

    expect(hook.result.current[0]).toEqual(5);
  });

  test('dec() should decrement state value', () => {
    const hook = renderHook(() => useNumberState(5));
    const [, , { dec }] = hook.result.current;

    act(() => dec(5));

    expect(hook.result.current[0]).toEqual(0);
  });

  test('dec() should decrement state and check min value', () => {
    const hook = renderHook(() => useNumberState(10, { min: 5 }));
    const [, , { dec }] = hook.result.current;

    act(() => dec(10));

    expect(hook.result.current[0]).toEqual(5);
  });
});
