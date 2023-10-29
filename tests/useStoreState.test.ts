import { act, renderHook } from '@testing-library/react';
import useStoreState from '../src/useStoreState';

describe('useStoreState()', () => {
  test('initialValue', () => {
    const { result } = renderHook(() => useStoreState('name', 'Richard'));

    expect(result.current[0]).toEqual('Richard');
  });

  test('setState() should update the state value', () => {
    const { result } = renderHook(() => useStoreState('name', 'Richard'));
    const [, setState] = result.current;

    act(() => setState('Ward'));

    expect(result.current[0]).toEqual('Ward');
  });
});
