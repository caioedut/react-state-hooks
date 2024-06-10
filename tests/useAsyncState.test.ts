import { act, renderHook, waitFor } from '@testing-library/react';
import useAsyncState from '../src/useAsyncState';

describe('useAsyncState()', () => {
  test('getter() should fetch value', async () => {
    const { result } = renderHook(() => useAsyncState(async () => 'Hello World!'));

    await waitFor(() => {
      expect(result.current[0]).toBeDefined();
    });

    expect(result.current[0]).toEqual('Hello World!');
  });

  test('setState() should update the state value', async () => {
    const { result } = renderHook(() => useAsyncState(async () => 'Hello World!'));

    await waitFor(() => {
      expect(result.current[0]).toBeDefined();
    });

    act(() => result.current[1]('Hello Again!'));

    expect(result.current[0]).toEqual('Hello Again!');
  });

  test('getter() should set isLoading', async () => {
    const { result } = renderHook(() => useAsyncState(async () => 'Hello World!'));

    expect(result.current[2].isPending).toEqual(true);

    await waitFor(() => {
      expect(result.current[0]).toBeDefined();
    });

    expect(result.current[2].isPending).toEqual(false);
  });

  test('getter() should set error and clean data', async () => {
    const { result } = renderHook(() =>
      useAsyncState(async () => {
        throw new Error('Oops!');
      }),
    );

    await waitFor(() => {
      expect(result.current[2].error).toBeDefined();
    });

    expect(result.current[0]).toEqual(undefined);
    expect(result.current[2].isPending).toEqual(false);
    expect(result.current[2].error).toBeInstanceOf(Error);
  });
});
