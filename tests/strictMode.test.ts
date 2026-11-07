import { describe, expect, test, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { StrictMode } from 'react';
import { useAsyncState } from '../src/useAsyncState';
import { useControllableState } from '../src/useControllableState';
import { useCycleState } from '../src/useCycleState';
import { useDebounceState } from '../src/useDebounceState';
import { useDependentState } from '../src/useDependentState';
import { useHistoryState } from '../src/useHistoryState';
import { useImmutableState } from '../src/useImmutableState';
import { useListState } from '../src/useListState';
import { useMapState } from '../src/useMapState';
import { useNumberState } from '../src/useNumberState';
import { useObjectState } from '../src/useObjectState';
import { usePreviousState } from '../src/usePreviousState';
import { usePropState } from '../src/usePropState';
import { useSetState } from '../src/useSetState';
import { useStoreState } from '../src/useStoreState';
import { useThrottleState } from '../src/useThrottleState';
import { useToggleState } from '../src/useToggleState';
import { deferred, uniqueKey } from './helpers';

/**
 * StrictMode renders components twice and mounts effects twice (mount -> unmount -> mount).
 * Hooks must stay correct under that: pure initializers, no leaked timers, no stuck subscriptions.
 */
function renderStrict<Result, Props>(callback: (props: Props) => Result, initialProps?: Props) {
  return renderHook(callback, { wrapper: StrictMode, ...(initialProps === undefined ? {} : { initialProps }) });
}

describe('StrictMode', () => {
  test('useAsyncState should load the value and end up not pending', async () => {
    const { result } = renderStrict(() => useAsyncState(async () => 'value'));

    await waitFor(() => expect(result.current[2].isPending).toBe(false));

    expect(result.current[0]).toBe('value');
    expect(result.current[2].error).toBeUndefined();
  });

  test('useAsyncState should only keep the latest of the runs started by the double mount', async () => {
    const requests: ReturnType<typeof deferred<string>>[] = [];

    const { result } = renderStrict(() =>
      useAsyncState(() => {
        const request = deferred<string>();
        requests.push(request);
        return request.promise;
      }),
    );

    expect(requests.length).toBeGreaterThanOrEqual(2);

    await act(async () => requests.at(-1)?.resolve('latest'));
    await act(async () => requests[0]?.resolve('outdated'));

    expect(result.current[0]).toBe('latest');
    expect(result.current[2].isPending).toBe(false);
  });

  test('useDebounceState should still apply the update after the delay', () => {
    vi.useFakeTimers();

    try {
      const { result } = renderStrict(() => useDebounceState('initial', 100));

      act(() => result.current[1]('next'));
      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(result.current[0]).toBe('next');
    } finally {
      vi.useRealTimers();
    }
  });

  test('useDependentState should derive the value', () => {
    const { result, rerender } = renderStrict(({ dep }) => useDependentState(() => dep, [dep]), { dep: 1 });

    expect(result.current[0]).toBe(1);

    rerender({ dep: 2 });

    expect(result.current[0]).toBe(2);
  });

  test('useHistoryState should not duplicate history entries', () => {
    const { result } = renderStrict(() => useHistoryState(1));

    act(() => result.current[1](2));

    expect(result.current[0]).toBe(2);
    expect(result.current[2].history).toEqual([1, 2]);
  });

  test('useHistoryState should undo and redo without duplicating entries', () => {
    const { result } = renderStrict(() => useHistoryState(1));

    act(() => result.current[1](2));
    act(() => result.current[2].undo());

    expect(result.current[0]).toBe(1);
    expect(result.current[2].future).toEqual([2]);

    act(() => result.current[2].redo());

    expect(result.current[0]).toBe(2);
    expect(result.current[2].history).toEqual([1, 2]);
  });

  test('useMapState should apply each action once', () => {
    const { result } = renderStrict(() => useMapState<string, number>());

    act(() => result.current[1].set('a', 1));
    act(() => result.current[1].update('a', (value = 0) => value + 1));

    expect(result.current[0].get('a')).toBe(2);
  });

  test('useSetState should apply each action once', () => {
    const { result } = renderStrict(() => useSetState<number>());

    act(() => result.current[1].toggle(1));
    act(() => result.current[1].add(2));

    expect([...result.current[0]]).toEqual([1, 2]);
  });

  test('useThrottleState should apply the first update and the held one', () => {
    vi.useFakeTimers();

    try {
      const { result } = renderStrict(() => useThrottleState(0, 100));

      act(() => result.current[1](1));
      act(() => result.current[1](2));
      expect(result.current[0]).toBe(1);

      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(result.current[0]).toBe(2);
    } finally {
      vi.useRealTimers();
    }
  });

  test('useControllableState should call onChange once per change, controlled or not', () => {
    const onChange = vi.fn();
    const { result } = renderStrict(() => useControllableState({ defaultValue: 0, onChange }));

    act(() => result.current[1]((current) => current + 1));

    expect(result.current[0]).toBe(1);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  test('useControllableState should follow a controlled value', () => {
    const { result, rerender } = renderStrict(({ value }) => useControllableState({ value }), { value: 'a' });

    rerender({ value: 'b' });

    expect(result.current[0]).toBe('b');
  });

  test('useCycleState should move once per call', () => {
    const { result } = renderStrict(() => useCycleState(['a', 'b', 'c']));

    act(() => result.current[1].next());

    expect(result.current[0]).toBe('b');
  });

  test('usePreviousState should return the previous distinct value', () => {
    const { result, rerender } = renderStrict(({ value }) => usePreviousState(value), { value: 1 });

    rerender({ value: 2 });
    rerender({ value: 2 });

    expect(result.current).toBe(1);
  });

  test('useImmutableState should keep a single value', () => {
    const { result, rerender } = renderStrict(() => useImmutableState(() => ({ id: 1 })));
    const first = result.current;

    rerender();

    expect(result.current).toBe(first);
  });

  test('useListState should apply each action once', () => {
    const { result } = renderStrict(() => useListState<number>());

    act(() => result.current[1].push(1));
    act(() => result.current[1].push(2));

    expect(result.current[0]).toEqual([1, 2]);
  });

  test('useNumberState should increment once per call', () => {
    const { result } = renderStrict(() => useNumberState(0));

    act(() => result.current[2].inc());
    act(() => result.current[2].inc());

    expect(result.current[0]).toBe(2);
  });

  test('useObjectState should merge each patch once', () => {
    const { result } = renderStrict(() => useObjectState({ count: 0 }));

    act(() => result.current[1]((prev) => ({ count: prev.count + 1 })));

    expect(result.current[0]).toEqual({ count: 1 });
  });

  test('usePropState should follow the prop', () => {
    const { result, rerender } = renderStrict(({ name }) => usePropState(name), { name: 'Richard' });

    rerender({ name: 'Ward' });

    expect(result.current[0]).toBe('Ward');
  });

  test('useStoreState should resolve a lazy initial state once and keep subscriptions working', () => {
    const key = uniqueKey();
    const factory = vi.fn(() => 0);

    const { result } = renderStrict(() => useStoreState(key, factory));

    expect(factory).toHaveBeenCalledTimes(1);

    act(() => result.current[1]((prev) => prev + 1));

    expect(result.current[0]).toBe(1);
  });

  test('useToggleState should flip once per call', () => {
    const { result } = renderStrict(() => useToggleState(false));

    act(() => result.current[1]());

    expect(result.current[0]).toBe(true);
  });
});
