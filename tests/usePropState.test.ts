import { act, renderHook } from '@testing-library/react';
import usePropState from '../src/usePropState';
import { useState } from 'react';

describe('usePropState()', () => {
  test('initialValue(raw)', () => {
    const name = undefined;

    const { result } = renderHook(() => usePropState(name, 'Richard'));

    expect(result.current[0]).toEqual('Richard');
  });

  test('initialValue(function)', () => {
    const name = undefined;

    const { result } = renderHook(() => usePropState(name, () => 'Richard'));

    expect(result.current[0]).toEqual('Richard');
  });

  test('setState(raw) should update the state value', async () => {
    const name = 'Richard';

    const { result, rerender } = renderHook(() => usePropState(name));

    act(() => result.current[1]('Ward'));

    expect(result.current[0]).toEqual('Ward');
  });

  test('setState(function) should update the state value', async () => {
    const name = 'Richard';

    const { result, rerender } = renderHook(() => usePropState(name));

    act(() => result.current[1](() => 'Ward'));

    expect(result.current[0]).toEqual('Ward');
  });

  test('prop changes should update the state value', async () => {
    const { result: nameResult } = renderHook(() => useState('Richard'));

    const { result, rerender } = renderHook(({ name }) => usePropState(name), {
      initialProps: { name: nameResult.current[0] },
    });

    act(() => nameResult.current[1]('Ward'));

    rerender({ name: nameResult.current[0] });

    expect(result.current[0]).toEqual('Ward');
  });
});
