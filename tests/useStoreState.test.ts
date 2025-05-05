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

  test('setState() should update the state value using a function', () => {
    const { result } = renderHook(() => useStoreState('counter', 0));
    const [, setState] = result.current;

    act(() => setState((prev) => prev + 1));
    expect(result.current[0]).toEqual(1);
  });

  test('state should be shared across multiple hooks with the same key', () => {
    const { result: resultA } = renderHook(() => useStoreState('name', 'Richard'));
    const { result: resultB } = renderHook(() => useStoreState('name', 'Richard'));
    const [, setStateA] = resultA.current;
    const [, setStateB] = resultB.current;

    act(() => setStateA('Ward'));

    expect(resultA.current[0]).toEqual('Ward');
    expect(resultB.current[0]).toEqual('Ward');
  });

  test('listeners should be cleaned up when the component is unmounted', () => {
    const { result, unmount } = renderHook(() => useStoreState('name', 'Richard'));
    const [, setState] = result.current;

    // Register a listener that will update listenerTriggered when the state changes
    act(() => {
      setState('Ward');
    });

    // State change should trigger the listener
    expect(result.current[0]).toEqual('Ward');

    // Unmount the component
    unmount();

    // Try updating the state again after unmount
    act(() => {
      setState('John');
    });

    // State should not change after unmount because the listener was cleaned up
    expect(result.current[0]).toEqual('Ward');
  });

  test('should initialize state using a function', () => {
    const initialState = () => 'Richard';
    const { result } = renderHook(() => useStoreState('custom', initialState));

    expect(result.current[0]).toEqual('Richard');
  });
});
