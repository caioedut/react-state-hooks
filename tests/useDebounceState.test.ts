import { act, renderHook } from '@testing-library/react';
import useDebounceState from '../src/useDebounceState'; // Ajuste o caminho conforme necessário

jest.useFakeTimers(); // Utiliza timers simulados para controlar o debounce

describe('useDebounceState()', () => {
  test('initialValue', async () => {
    const { result } = renderHook(() => useDebounceState('initial', 500));

    expect(result.current[0]).toEqual('initial');
  });

  test('setValue should not immediately affect the debounced value', async () => {
    const { result } = renderHook(() => useDebounceState('initial', 500));

    act(() => {
      result.current[1]('updated immediately');
    });

    expect(result.current[0]).toEqual('initial'); // Ainda não deve ter alterado o debounced value
  });

  test('debounced value should update after the specified delay', async () => {
    const { result } = renderHook(() => useDebounceState('initial', 500));

    act(() => {
      result.current[1]('updated with debounce');
    });

    // Avança o tempo simulado para o debounce
    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Verifica se o debounced value foi atualizado
    expect(result.current[0]).toEqual('updated with debounce');
  });

  test('should reset debounce when setValue is called again before delay', async () => {
    const { result } = renderHook(() => useDebounceState('initial', 500));

    act(() => {
      result.current[1]('first value');
    });

    act(() => {
      jest.advanceTimersByTime(200);
    });

    act(() => {
      result.current[1]('second value');
    });

    // Avança mais tempo para o segundo set
    act(() => {
      jest.advanceTimersByTime(500);
    });

    // O segundo valor deve ser o final
    expect(result.current[0]).toEqual('second value');
  });

  test('should not update debounced value before the delay period', async () => {
    const { result } = renderHook(() => useDebounceState('initial', 500));

    act(() => {
      result.current[1]('value before debounce');
    });

    // Verifica que o valor ainda é o inicial antes do delay
    expect(result.current[0]).toEqual('initial');

    // Avança o tempo para simular o debounce
    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(result.current[0]).toEqual('value before debounce');
  });
});
