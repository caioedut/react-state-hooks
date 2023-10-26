import { act, renderHook } from '@testing-library/react';
import useListState from '../src/useListState';

describe('useListState()', () => {
  test('initialValue', () => {
    const { result } = renderHook(() => useListState([1, 2, 3]));

    expect(result.current[0]).toEqual([1, 2, 3]);
  });

  test('set() should reset the list with new values', () => {
    const { result } = renderHook(() => useListState());
    const [, actions] = result.current;

    act(() => actions.set([1, 2, 3]));

    expect(result.current[0]).toEqual([1, 2, 3]);
  });

  test('clear() should empty the list', () => {
    const { result } = renderHook(() => useListState([1, 2, 3]));
    const [, actions] = result.current;

    act(() => actions.clear());

    expect(result.current[0]).toEqual([]);
  });

  test('sort() should sort the list', () => {
    const { result } = renderHook(() => useListState([3, 2, 1]));
    const [, actions] = result.current;

    act(() => actions.sort());

    expect(result.current[0]).toEqual([1, 2, 3]);
  });

  test('filter() should filter items on list', () => {
    const { result } = renderHook(() => useListState([1, 2, 3]));
    const [, actions] = result.current;

    act(() => actions.filter((item) => item > 1));

    expect(result.current[0]).toEqual([2, 3]);
  });

  test('push() should add items to the list', () => {
    const { result } = renderHook(() => useListState());
    const [, actions] = result.current;

    act(() => actions.push(1, 2, 3));

    expect(result.current[0]).toEqual([1, 2, 3]);
  });

  test('insert() should add an item on a given index', () => {
    const { result } = renderHook(() => useListState());
    const [, actions] = result.current;

    act(() => actions.insert(0, 1));

    expect(result.current[0]).toEqual([1]);
  });

  test('remove() should remove item by index', () => {
    const { result } = renderHook(() => useListState([1, 2, 3]));
    const [, actions] = result.current;

    act(() => actions.remove(0));

    expect(result.current[0]).toEqual([2, 3]);
  });

  test('remove() should remove item by handler', () => {
    const { result } = renderHook(() => useListState([1, 2, 3]));
    const [, actions] = result.current;

    act(() => actions.remove((item) => item === 1));

    expect(result.current[0]).toEqual([2, 3]);
  });

  test('update() should update item by index', () => {
    const { result } = renderHook(() => useListState([1, 2, 3]));
    const [, actions] = result.current;

    act(() => actions.update(0, 4));

    expect(result.current[0]).toEqual([4, 2, 3]);
  });

  test('update() should update item by handler', () => {
    const { result } = renderHook(() => useListState([1, 2, 3]));
    const [, actions] = result.current;

    act(() => actions.update((item) => item === 1, 4));

    expect(result.current[0]).toEqual([4, 2, 3]);
  });
});
