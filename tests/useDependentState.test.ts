import { act, renderHook } from '@testing-library/react';
import useDependentState from '../src/useDependentState';
import { useState } from 'react';

describe('useDependentState()', () => {
  test('initialValue', async () => {
    const { result: depResult } = renderHook(() => useState('any value'));

    const { result: stateResult } = renderHook(({ dep }) => useDependentState(() => dep, [dep]), {
      initialProps: { dep: depResult.current[0] },
    });

    expect(stateResult.current[0]).toEqual('any value');
  });

  test('setState() should update the state value', async () => {
    const { result: depResult } = renderHook(() => useState('any value'));

    const { result: stateResult } = renderHook(({ dep }) => useDependentState(() => dep, [dep]), {
      initialProps: { dep: depResult.current[0] },
    });

    act(() => {
      stateResult.current[1]('new value');
    });

    expect(stateResult.current[0]).toEqual('new value');
  });

  test('[deps] should update the state value', async () => {
    const { result: depResult } = renderHook(() => useState('any value'));

    const { rerender, result: stateResult } = renderHook(({ dep }) => useDependentState(() => dep, [dep]), {
      initialProps: { dep: depResult.current[0] },
    });

    act(() => {
      depResult.current[1]('other value');
    });

    rerender({ dep: depResult.current[0] });

    expect(stateResult.current[0]).toEqual('other value');
  });
});
