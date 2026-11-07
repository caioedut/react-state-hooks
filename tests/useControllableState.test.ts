import { describe, expect, test, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useControllableState } from '../src/useControllableState';

describe('useControllableState()', () => {
  describe('uncontrolled', () => {
    test('should be undefined without a default value', () => {
      const { result } = renderHook(() => useControllableState<string>());

      expect(result.current[0]).toBeUndefined();
    });

    test('should start with the default value', () => {
      const { result } = renderHook(() => useControllableState({ defaultValue: 'initial' }));

      expect(result.current[0]).toBe('initial');
    });

    test('should accept a lazy default value', () => {
      const { result } = renderHook(() => useControllableState({ defaultValue: () => 'lazy' }));

      expect(result.current[0]).toBe('lazy');
    });

    test('should resolve a lazy default value only once', () => {
      const factory = vi.fn(() => 'lazy');
      const { rerender } = renderHook(() => useControllableState({ defaultValue: factory }));

      rerender();

      expect(factory).toHaveBeenCalledTimes(1);
    });

    test.each([[0], [''], [false], [null]])('should keep the falsy default value %p', (defaultValue) => {
      const { result } = renderHook(() => useControllableState<unknown>({ defaultValue }));

      expect(result.current[0]).toBe(defaultValue);
    });

    test('should update the value', () => {
      const { result } = renderHook(() => useControllableState({ defaultValue: 'a' }));

      act(() => result.current[1]('b'));

      expect(result.current[0]).toBe('b');
    });

    test('should call onChange with the new value', () => {
      const onChange = vi.fn();
      const { result } = renderHook(() => useControllableState({ defaultValue: 'a', onChange }));

      act(() => result.current[1]('b'));

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith('b');
    });

    test('should work without onChange', () => {
      const { result } = renderHook(() => useControllableState({ defaultValue: 'a' }));

      expect(() => act(() => result.current[1]('b'))).not.toThrow();
      expect(result.current[0]).toBe('b');
    });

    test('should accept an updater that receives the current value', () => {
      const onChange = vi.fn();
      const { result } = renderHook(() => useControllableState({ defaultValue: 1, onChange }));

      act(() => result.current[1]((current) => current + 1));

      expect(result.current[0]).toBe(2);
      expect(onChange).toHaveBeenCalledWith(2);
    });

    test('should chain updaters called inside the same batch', () => {
      const onChange = vi.fn();
      const { result } = renderHook(() => useControllableState({ defaultValue: 0, onChange }));

      act(() => {
        result.current[1]((current) => current + 1);
        result.current[1]((current) => current + 1);
      });

      expect(result.current[0]).toBe(2);
      expect(onChange).toHaveBeenNthCalledWith(1, 1);
      expect(onChange).toHaveBeenNthCalledWith(2, 2);
    });

    test('should not call onChange nor re-render when the value is the same', () => {
      const onChange = vi.fn();
      let renders = 0;
      const { result } = renderHook(() => {
        renders++;
        return useControllableState({ defaultValue: 'a', onChange });
      });

      const before = renders;
      act(() => result.current[1]('a'));

      expect(onChange).not.toHaveBeenCalled();
      expect(renders).toBe(before);
    });

    test('should be able to set the value back to undefined', () => {
      const onChange = vi.fn();
      const { result } = renderHook(() => useControllableState<string | undefined>({ defaultValue: 'a', onChange }));

      act(() => result.current[1](undefined));

      expect(result.current[0]).toBeUndefined();
      expect(onChange).toHaveBeenCalledWith(undefined);
    });

    test('should use the latest onChange', () => {
      const first = vi.fn();
      const second = vi.fn();

      const { result, rerender } = renderHook(({ onChange }) => useControllableState({ defaultValue: 'a', onChange }), {
        initialProps: { onChange: first },
      });

      rerender({ onChange: second });
      act(() => result.current[1]('b'));

      expect(first).not.toHaveBeenCalled();
      expect(second).toHaveBeenCalledWith('b');
    });

    test('should ignore a changed default value after mount', () => {
      const { result, rerender } = renderHook(({ defaultValue }) => useControllableState({ defaultValue }), {
        initialProps: { defaultValue: 'a' },
      });

      rerender({ defaultValue: 'b' });

      expect(result.current[0]).toBe('a');
    });
  });

  describe('controlled', () => {
    test('should not render more than once on mount', () => {
      let renders = 0;

      renderHook(() => {
        renders++;
        return useControllableState({ value: 'controlled' });
      });

      expect(renders).toBe(1);
    });

    test('should not render more than once on mount when uncontrolled', () => {
      let renders = 0;

      renderHook(() => {
        renders++;
        return useControllableState({ defaultValue: 'default' });
      });

      expect(renders).toBe(1);
    });

    test('should return the controlled value', () => {
      const { result } = renderHook(() => useControllableState({ value: 'controlled' }));

      expect(result.current[0]).toBe('controlled');
    });

    test('should prefer the controlled value over the default value', () => {
      const { result } = renderHook(() => useControllableState({ value: 'controlled', defaultValue: 'default' }));

      expect(result.current[0]).toBe('controlled');
    });

    test('should not change the value on its own, only call onChange', () => {
      const onChange = vi.fn();
      const { result } = renderHook(() => useControllableState({ value: 'a', onChange }));

      act(() => result.current[1]('b'));

      expect(result.current[0]).toBe('a');
      expect(onChange).toHaveBeenCalledWith('b');
    });

    test('should follow the value that the parent passes', () => {
      const { result, rerender } = renderHook(({ value }) => useControllableState({ value }), {
        initialProps: { value: 'a' },
      });

      rerender({ value: 'b' });

      expect(result.current[0]).toBe('b');
    });

    test('should work as a loop with the parent state', () => {
      const { result, rerender } = renderHook(
        ({ value }) => {
          const state = useControllableState({ value, onChange: (next: number) => rerender({ value: next }) });
          return state;
        },
        { initialProps: { value: 1 } },
      );

      act(() => result.current[1]((current) => current + 1));

      expect(result.current[0]).toBe(2);
    });

    test('should give updaters the controlled value', () => {
      const onChange = vi.fn();
      const { result } = renderHook(() => useControllableState({ value: 10, onChange }));

      act(() => result.current[1]((current) => current + 1));

      expect(onChange).toHaveBeenCalledWith(11);
    });

    test('should not chain updaters in the same batch, since the parent decides the value', () => {
      const onChange = vi.fn();
      const { result } = renderHook(() => useControllableState({ value: 0, onChange }));

      act(() => {
        result.current[1]((current) => current + 1);
        result.current[1]((current) => current + 1);
      });

      expect(onChange).toHaveBeenCalledTimes(2);
      expect(onChange).toHaveBeenNthCalledWith(1, 1);
      expect(onChange).toHaveBeenNthCalledWith(2, 1);
    });

    test('should not call onChange when the new value is the controlled one', () => {
      const onChange = vi.fn();
      const { result } = renderHook(() => useControllableState({ value: 'a', onChange }));

      act(() => result.current[1]('a'));

      expect(onChange).not.toHaveBeenCalled();
    });

    test('should treat null as a controlled value', () => {
      const onChange = vi.fn();
      const { result } = renderHook(() =>
        useControllableState<string | null>({ value: null, defaultValue: 'x', onChange }),
      );

      expect(result.current[0]).toBeNull();

      act(() => result.current[1]('y'));

      expect(result.current[0]).toBeNull();
      expect(onChange).toHaveBeenCalledWith('y');
    });

    test.each([[0], [''], [false]])('should treat the falsy value %p as controlled', (value) => {
      const { result } = renderHook(() => useControllableState<unknown>({ value, defaultValue: 'x' }));

      expect(result.current[0]).toBe(value);
    });

    test('should use the latest onChange', () => {
      const first = vi.fn();
      const second = vi.fn();

      const { result, rerender } = renderHook(({ onChange }) => useControllableState({ value: 'a', onChange }), {
        initialProps: { onChange: first },
      });

      rerender({ onChange: second });
      act(() => result.current[1]('b'));

      expect(first).not.toHaveBeenCalled();
      expect(second).toHaveBeenCalledWith('b');
    });
  });

  describe('switching between controlled and uncontrolled', () => {
    test('should keep the last controlled value when it becomes uncontrolled', () => {
      const { result, rerender } = renderHook(
        ({ value }: { value: string | undefined }) => useControllableState({ value, defaultValue: 'default' }),
        { initialProps: { value: 'controlled' } as { value: string | undefined } },
      );

      rerender({ value: undefined });

      expect(result.current[0]).toBe('controlled');
    });

    test('should manage itself after it becomes uncontrolled', () => {
      const onChange = vi.fn();

      const { result, rerender } = renderHook(
        ({ value }: { value: string | undefined }) =>
          useControllableState({ value, defaultValue: 'default', onChange }),
        { initialProps: { value: 'controlled' } as { value: string | undefined } },
      );

      rerender({ value: undefined });
      act(() => result.current[1]('own'));

      expect(result.current[0]).toBe('own');
      expect(onChange).toHaveBeenCalledWith('own');
    });

    test('should follow the value when it becomes controlled', () => {
      const { result, rerender } = renderHook(
        ({ value }: { value: string | undefined }) => useControllableState({ value, defaultValue: 'default' }),
        { initialProps: { value: undefined } as { value: string | undefined } },
      );

      expect(result.current[0]).toBe('default');

      rerender({ value: 'controlled' });

      expect(result.current[0]).toBe('controlled');
    });

    test('should stop managing itself once it becomes controlled', () => {
      const { result, rerender } = renderHook(
        ({ value }: { value: string | undefined }) => useControllableState({ value, defaultValue: 'default' }),
        { initialProps: { value: undefined } as { value: string | undefined } },
      );

      act(() => result.current[1]('own'));
      rerender({ value: 'controlled' });
      act(() => result.current[1]('ignored'));

      expect(result.current[0]).toBe('controlled');
    });

    test('should never render a stale value when the controlled value changes', () => {
      const seen: string[] = [];

      const { rerender } = renderHook(
        ({ value }) => {
          const [current] = useControllableState({ value });
          seen.push(current);
          return current;
        },
        { initialProps: { value: 'a' } },
      );

      rerender({ value: 'b' });

      expect(seen[0]).toBe('a');
      expect(seen.slice(1).every((item) => item === 'b')).toBe(true);
    });
  });

  describe('identity', () => {
    test('setValue should be stable between renders, in both modes', () => {
      const { result, rerender } = renderHook(
        ({ value }: { value: string | undefined }) => useControllableState({ value, defaultValue: 'x' }),
        { initialProps: { value: undefined } as { value: string | undefined } },
      );
      const setValue = result.current[1];

      act(() => setValue('a'));
      rerender({ value: 'controlled' });

      expect(result.current[1]).toBe(setValue);
    });
  });
});
