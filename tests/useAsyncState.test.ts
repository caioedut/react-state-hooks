import { act, renderHook, waitFor } from '@testing-library/react';
import useAsyncState from '../src/useAsyncState';

describe('useAsyncState()', () => {
  test('getter() should fetch value', async () => {
    const { result } = renderHook(() => useAsyncState(async () => 'Hello World!'));

    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });

    expect(result.current.data).toEqual('Hello World!');
  });

  test('isLoading should respect lifecycle', async () => {
    const { result } = renderHook(() => useAsyncState(async () => 'Hello World!'));

    expect(result.current.isLoading).toEqual(true);

    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });
  });

  // TODO: error check
  // test('error should be defined', async () => {});
});
