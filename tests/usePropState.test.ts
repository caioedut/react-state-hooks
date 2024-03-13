import { act, renderHook } from '@testing-library/react';
import usePropState from '../src/usePropState';
import { useState } from 'react';
import useDependentState from '../src/useDependentState';

describe('usePropState()', () => {
  test('initialValue', () => {
    const nameProp = undefined;

    const { result } = renderHook(() => usePropState(nameProp, 'Richard'));

    expect(result.current[0]).toEqual('Richard');
  });

  test('setState() should update the state value', async () => {
    const nameProp = undefined;

    const { result, rerender } = renderHook(() => usePropState(nameProp, 'Richard'));

    act(() => result.current[1]('Ward'));

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
