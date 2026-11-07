import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useAsyncState } from '../src/useAsyncState';
import { deferred } from './helpers';

describe('useAsyncState()', () => {
  describe('loading', () => {
    test('should fetch the value on mount', async () => {
      const { result } = renderHook(() => useAsyncState(async () => 'Hello World!'));

      await waitFor(() => expect(result.current[0]).toBe('Hello World!'));
    });

    test('should start as pending with no data and no error', () => {
      const { result } = renderHook(() => useAsyncState(() => deferred<string>().promise));

      expect(result.current[0]).toBeUndefined();
      expect(result.current[2].isPending).toBe(true);
      expect(result.current[2].error).toBeUndefined();
    });

    test('should stop being pending after the value is loaded', async () => {
      const { result } = renderHook(() => useAsyncState(async () => 'Hello World!'));

      await waitFor(() => expect(result.current[2].isPending).toBe(false));

      expect(result.current[0]).toBe('Hello World!');
    });

    test.each([[0], [''], [false], [null]])('should keep the falsy value %p', async (value) => {
      const { result } = renderHook(() => useAsyncState(async () => value));

      await waitFor(() => expect(result.current[2].isPending).toBe(false));

      expect(result.current[0]).toBe(value);
    });

    test('should call the getter once on mount', async () => {
      const getter = vi.fn(async () => 1);
      const { result } = renderHook(() => useAsyncState(getter));

      await waitFor(() => expect(result.current[2].isPending).toBe(false));

      expect(getter).toHaveBeenCalledTimes(1);
    });

    test('should not call the getter again on re-renders when the deps are the same', async () => {
      const getter = vi.fn(async () => 1);
      const { result, rerender } = renderHook(() => useAsyncState(getter, ['a']));

      await waitFor(() => expect(result.current[2].isPending).toBe(false));
      rerender();
      rerender();

      expect(getter).toHaveBeenCalledTimes(1);
    });

    test('should run again when the deps change', async () => {
      const { result, rerender } = renderHook(({ id }) => useAsyncState(async () => `item ${id}`, [id]), {
        initialProps: { id: 1 },
      });

      await waitFor(() => expect(result.current[0]).toBe('item 1'));

      rerender({ id: 2 });

      await waitFor(() => expect(result.current[0]).toBe('item 2'));
    });

    test('should be pending again while a new run is in flight', async () => {
      const first = deferred<string>();
      const second = deferred<string>();
      const promises = [first.promise, second.promise];
      let call = 0;

      const { result, rerender } = renderHook(({ id }) => useAsyncState(() => promises[call++]!, [id]), {
        initialProps: { id: 1 },
      });

      await act(async () => first.resolve('first'));
      expect(result.current[2].isPending).toBe(false);

      rerender({ id: 2 });
      expect(result.current[2].isPending).toBe(true);

      await act(async () => second.resolve('second'));
      expect(result.current[2].isPending).toBe(false);
      expect(result.current[0]).toBe('second');
    });
  });

  describe('errors', () => {
    test('should set the error and clear the data', async () => {
      const { result } = renderHook(() =>
        useAsyncState(async () => {
          throw new Error('Oops!');
        }),
      );

      await waitFor(() => expect(result.current[2].error).toBeDefined());

      expect(result.current[0]).toBeUndefined();
      expect(result.current[2].isPending).toBe(false);
      expect(result.current[2].error).toBeInstanceOf(Error);
    });

    test('should keep any rejected value as the error', async () => {
      const { result } = renderHook(() => useAsyncState(() => Promise.reject('boom')));

      await waitFor(() => expect(result.current[2].error).toBe('boom'));
    });

    test('should clear previous data when a later run fails', async () => {
      let fail = false;

      const { result } = renderHook(() =>
        useAsyncState(async () => {
          if (fail) throw new Error('Oops!');
          return 'ok';
        }),
      );

      await waitFor(() => expect(result.current[0]).toBe('ok'));

      fail = true;
      await act(async () => {
        await result.current[2].revalidate();
      });

      expect(result.current[0]).toBeUndefined();
      expect(result.current[2].error).toBeInstanceOf(Error);
    });

    test('should clear the error when a later run succeeds', async () => {
      let fail = true;

      const { result } = renderHook(() =>
        useAsyncState(async () => {
          if (fail) throw new Error('Oops!');
          return 'ok';
        }),
      );

      await waitFor(() => expect(result.current[2].error).toBeDefined());

      fail = false;
      await act(async () => {
        await result.current[2].revalidate();
      });

      expect(result.current[2].error).toBeUndefined();
      expect(result.current[0]).toBe('ok');
    });

    test('should ignore the error of an outdated run', async () => {
      const first = deferred<string>();
      const second = deferred<string>();
      const promises: Record<number, Promise<string>> = { 1: first.promise, 2: second.promise };

      const { result, rerender } = renderHook(({ id }) => useAsyncState(() => promises[id]!, [id]), {
        initialProps: { id: 1 },
      });

      rerender({ id: 2 });

      await act(async () => second.resolve('second'));
      await act(async () => first.reject(new Error('late')));

      expect(result.current[0]).toBe('second');
      expect(result.current[2].error).toBeUndefined();
    });
  });

  describe('races and abort', () => {
    test('an outdated response should not overwrite a newer one', async () => {
      const first = deferred<string>();
      const second = deferred<string>();
      const promises: Record<number, Promise<string>> = { 1: first.promise, 2: second.promise };

      const { result, rerender } = renderHook(({ id }) => useAsyncState(() => promises[id]!, [id]), {
        initialProps: { id: 1 },
      });

      rerender({ id: 2 });

      await act(async () => second.resolve('second'));
      await act(async () => first.resolve('first'));

      expect(result.current[0]).toBe('second');
      expect(result.current[2].isPending).toBe(false);
    });

    test('should give the getter a signal that is not aborted while the run is current', async () => {
      const signals: AbortSignal[] = [];

      const { result } = renderHook(() =>
        useAsyncState(async (signal) => {
          signals.push(signal);
          return 1;
        }),
      );

      await waitFor(() => expect(result.current[2].isPending).toBe(false));

      expect(signals[0]?.aborted).toBe(false);
    });

    test('should abort the signal of an outdated run', async () => {
      const signals: AbortSignal[] = [];

      const { rerender } = renderHook(
        ({ id }) =>
          useAsyncState(
            async (signal) => {
              signals.push(signal);
              return id;
            },
            [id],
          ),
        { initialProps: { id: 1 } },
      );

      rerender({ id: 2 });

      await waitFor(() => expect(signals).toHaveLength(2));

      expect(signals[0]?.aborted).toBe(true);
      expect(signals[1]?.aborted).toBe(false);
    });

    test('should abort the signal on unmount', async () => {
      const signals: AbortSignal[] = [];

      const { unmount } = renderHook(() =>
        useAsyncState((signal) => {
          signals.push(signal);
          return deferred<string>().promise;
        }),
      );

      unmount();

      expect(signals[0]?.aborted).toBe(true);
    });

    test('should ignore a response that arrives after unmount', async () => {
      const request = deferred<string>();
      const { result, unmount } = renderHook(() => useAsyncState(() => request.promise));

      unmount();
      await act(async () => request.resolve('late'));

      expect(result.current[0]).toBeUndefined();
    });

    test('should abort the run in flight when revalidate() is called', async () => {
      const signals: AbortSignal[] = [];

      const { result } = renderHook(() =>
        useAsyncState((signal) => {
          signals.push(signal);
          return deferred<string>().promise;
        }),
      );

      act(() => {
        void result.current[2].revalidate();
      });

      expect(signals).toHaveLength(2);
      expect(signals[0]?.aborted).toBe(true);
      expect(signals[1]?.aborted).toBe(false);
    });
  });

  describe('without a platform AbortController', () => {
    const NativeAbortController = globalThis.AbortController;

    beforeEach(() => {
      // @ts-expect-error simulating a runtime that has no AbortController
      delete globalThis.AbortController;
    });

    afterEach(() => {
      globalThis.AbortController = NativeAbortController;
    });

    test('should still load the value and not crash', async () => {
      const { result } = renderHook(() => useAsyncState(async () => 'value'));

      await waitFor(() => expect(result.current[2].isPending).toBe(false));

      expect(result.current[0]).toBe('value');
      expect(result.current[2].error).toBeUndefined();
    });

    test('should give the getter a signal that is aborted when the run becomes outdated', async () => {
      const signals: AbortSignal[] = [];

      const { rerender } = renderHook(
        ({ id }) =>
          useAsyncState(
            async (signal) => {
              signals.push(signal);
              return id;
            },
            [id],
          ),
        { initialProps: { id: 1 } },
      );

      rerender({ id: 2 });

      await waitFor(() => expect(signals).toHaveLength(2));

      expect(signals[0]?.aborted).toBe(true);
      expect(signals[1]?.aborted).toBe(false);
    });
  });

  describe('revalidate()', () => {
    test('should fetch again', async () => {
      let count = 0;
      const { result } = renderHook(() => useAsyncState(async () => ++count));

      await waitFor(() => expect(result.current[0]).toBe(1));

      await act(async () => {
        await result.current[2].revalidate();
      });

      expect(result.current[0]).toBe(2);
    });

    test('should set isPending while running', async () => {
      const first = deferred<number>();
      const second = deferred<number>();
      const promises = [first.promise, second.promise];
      let call = 0;

      const { result } = renderHook(() => useAsyncState(() => promises[call++]!));

      await act(async () => first.resolve(1));
      expect(result.current[2].isPending).toBe(false);

      act(() => {
        void result.current[2].revalidate();
      });
      expect(result.current[2].isPending).toBe(true);

      await act(async () => second.resolve(2));
      expect(result.current[2].isPending).toBe(false);
      expect(result.current[0]).toBe(2);
    });

    test('should use the latest getter without changing the deps', async () => {
      const { result, rerender } = renderHook(({ value }) => useAsyncState(async () => value), {
        initialProps: { value: 'old' },
      });

      await waitFor(() => expect(result.current[0]).toBe('old'));

      rerender({ value: 'new' });
      await act(async () => {
        await result.current[2].revalidate();
      });

      expect(result.current[0]).toBe('new');
    });

    test('should keep its identity between renders and deps changes', async () => {
      const { result, rerender } = renderHook(({ id }) => useAsyncState(async () => id, [id]), {
        initialProps: { id: 1 },
      });
      const revalidate = result.current[2].revalidate;

      rerender({ id: 2 });
      await waitFor(() => expect(result.current[0]).toBe(2));

      expect(result.current[2].revalidate).toBe(revalidate);
    });
  });

  describe('setData()', () => {
    test('should update the data', async () => {
      const { result } = renderHook(() => useAsyncState(async () => 'Hello World!'));

      await waitFor(() => expect(result.current[0]).toBeDefined());

      act(() => result.current[1]('Hello Again!'));

      expect(result.current[0]).toBe('Hello Again!');
    });

    test('should accept an updater that receives the current data', async () => {
      const { result } = renderHook(() => useAsyncState(async () => 1));

      await waitFor(() => expect(result.current[0]).toBe(1));

      act(() => result.current[1]((prev) => (prev ?? 0) + 1));

      expect(result.current[0]).toBe(2);
    });

    test('should give the updater undefined before any data exists', () => {
      const updater = vi.fn(() => 1);
      const { result } = renderHook(() => useAsyncState(() => deferred<number>().promise));

      act(() => result.current[1](updater));

      expect(updater).toHaveBeenCalledWith(undefined);
    });

    test('should stop being pending', () => {
      const { result } = renderHook(() => useAsyncState(() => deferred<string>().promise));

      act(() => result.current[1]('manual'));

      expect(result.current[2].isPending).toBe(false);
    });

    test('should clear the error', async () => {
      const { result } = renderHook(() => useAsyncState<string>(() => Promise.reject(new Error('Oops!'))));

      await waitFor(() => expect(result.current[2].error).toBeDefined());

      act(() => result.current[1]('manual'));

      expect(result.current[2].error).toBeUndefined();
      expect(result.current[0]).toBe('manual');
    });

    test('should discard a run still in flight', async () => {
      const request = deferred<string>();
      const { result } = renderHook(() => useAsyncState(() => request.promise));

      act(() => result.current[1]('manual'));
      await act(async () => request.resolve('late'));

      expect(result.current[0]).toBe('manual');
      expect(result.current[2].isPending).toBe(false);
    });

    test('should keep its identity between renders', () => {
      const { result, rerender } = renderHook(() => useAsyncState(() => deferred<string>().promise));
      const setData = result.current[1];

      rerender();

      expect(result.current[1]).toBe(setData);
    });
  });
});
