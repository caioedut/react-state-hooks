import { act, renderHook } from '@testing-library/react';
import useHistoryState from '../src/useHistoryState';

describe('useHistoryState()', () => {
  test('initialValue', () => {
    const { result } = renderHook(() => useHistoryState(1));

    expect(result.current[0]).toEqual(1);
  });

  test('setState() should update the state value', () => {
    const { result } = renderHook(() => useHistoryState(1));
    const [, setState] = result.current;

    act(() => setState(2));

    expect(result.current[0]).toEqual(2);
  });

  test('setState() without initialValue should increment the history once', () => {
    const { result } = renderHook(() => useHistoryState());
    const [, setState, { history }] = result.current;

    act(() => setState(1));

    expect(history).toEqual([1]);
  });

  test('setState() with initialValue should increment the history twice', () => {
    const { result } = renderHook(() => useHistoryState(1));
    const [, setState, { history }] = result.current;

    act(() => setState(2));

    expect(history).toEqual([1, 2, 3]);
  });

  test('setState() must respect length rule', () => {
    const { result } = renderHook(() => useHistoryState());
    const [, setState, { history }] = result.current;

    act(() => setState(1));
    act(() => setState(2));
    act(() => setState(3));
    act(() => setState(4));
    act(() => setState(5));
    act(() => setState(6));
    act(() => setState(7));
    act(() => setState(8));
    act(() => setState(9));
    act(() => setState(10));
    act(() => setState(11));

    expect(history).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  });

  test('rollback() must backwards state value', () => {
    const { result } = renderHook(() => useHistoryState(1));
    const [, setState, { rollback }] = result.current;

    act(() => setState(2));
    act(() => rollback());

    expect(result.current[0]).toEqual(1);
  });
});
