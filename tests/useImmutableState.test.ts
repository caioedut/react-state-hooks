import { renderHook } from '@testing-library/react';
import useImmutableState from '../src/useImmutableState';

describe('useImmutableState()', () => {
  test('immutableValue', () => {
    const { result } = renderHook(() => useImmutableState('Richard'));

    expect(result.current).toEqual('Richard');
  });
});
