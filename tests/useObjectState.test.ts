import { act, renderHook } from '@testing-library/react';
import useObjectState from '../src/useObjectState';

type Person = {
  name: string;
  age?: number;
};

describe('useObjectState()', () => {
  test('initialValue', () => {
    const { result } = renderHook(() => useObjectState<Person>({ name: 'Richard' }));

    expect(result.current[0]).toEqual({ name: 'Richard' });
  });

  test('updateState() should add props to the object', () => {
    const { result } = renderHook(() => useObjectState<Person>({ name: 'Richard' }));
    const [, updateObject] = result.current;

    act(() => updateObject({ age: 21 }));

    expect(result.current[0]).toEqual({
      name: 'Richard',
      age: 21,
    });
  });

  test('resetState() without params should clear all props', () => {
    const { result } = renderHook(() => useObjectState<Person>({ name: 'Richard' }));
    const [, , resetObject] = result.current;

    act(() => resetObject());

    expect(result.current[0]).toEqual({});
  });

  test('resetState() with params should reset the object with new values', () => {
    const { result } = renderHook(() => useObjectState<Person>({ name: 'Richard', age: 21 }));
    const [, , resetObject] = result.current;

    act(() => resetObject({ name: 'Richard' }));

    expect(result.current[0]).toEqual({ name: 'Richard' });
  });
});
