import { renderHook } from '@testing-library/react';
import { usePropState } from '../src';

describe('usePropState()', () => {
  test('initialValue', () => {
    const nameProp = undefined;
    const { result } = renderHook(() => usePropState(nameProp, 'Richard'));

    expect(result.current[0]).toEqual('Richard');
  });
});
