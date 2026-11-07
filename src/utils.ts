import type { DependencyList } from 'react';
import type { Initializer, Updater } from './types';

/**
 * Resolves a lazy initializer.
 *
 * @param initializer - A value, or a function that returns it.
 * @returns The value, calling the function when one is given.
 */
export function resolveInitializer<T>(initializer: Initializer<T>): T {
  return typeof initializer === 'function' ? (initializer as () => T)() : initializer;
}

/**
 * Resolves a value-or-updater against the previous value, like `useState` does.
 *
 * @param updater - The next value, or a function that derives it from the previous one.
 * @param previous - The previous value.
 * @returns The next value.
 */
export function resolveUpdater<T>(updater: Updater<T>, previous: T): T {
  return typeof updater === 'function' ? (updater as (previous: T) => T)(previous) : updater;
}

/**
 * Shallow comparison of two dependency lists, using `Object.is` like React does.
 *
 * @param a - First list.
 * @param b - Second list.
 * @returns `true` when both lists have the same size and every pair of items is the same value.
 */
export function areDepsEqual(a: DependencyList, b: DependencyList): boolean {
  return a.length === b.length && a.every((dep, index) => Object.is(dep, b[index]));
}

/**
 * Number of digits after the decimal point.
 *
 * @param value - Any finite number. Exponent notation is understood (`1e-7` has 7 decimals).
 * @returns For example `0.25` gives `2` and `3` gives `0`. Capped at 100, the maximum of `toFixed`.
 */
export function countDecimals(value: number): number {
  const match = /^\d*(?:\.(\d*))?(?:e([+-]?\d+))?$/.exec(String(Math.abs(value)));

  // NaN and Infinity have no decimals
  if (!match) {
    return 0;
  }

  const fraction = match[1] ?? '';
  const exponent = Number(match[2] ?? 0);

  return Math.min(100, Math.max(0, fraction.length - exponent));
}

/**
 * Creates something that behaves like an `AbortController`, without ever throwing.
 *
 * It uses the platform `AbortController` (browsers, Node, React Native) and falls back to a minimal
 * implementation when the global does not exist (very old React Native, unusual runtimes),
 * so hooks never crash because of a missing global.
 *
 * @returns The `signal` to hand to consumers and an `abort` function that aborts it.
 */
export function createAbortController(): { signal: AbortSignal; abort: () => void } {
  if (typeof AbortController === 'function') {
    const controller = new AbortController();

    return { signal: controller.signal, abort: () => controller.abort() };
  }

  // Polyfill
  const listeners = new Set<() => void>();

  const signal = {
    aborted: false,
    reason: undefined as unknown,
    onabort: null as (() => void) | null,
    addEventListener: (type: string, listener: () => void) => {
      if (type === 'abort') {
        listeners.add(listener);
      }
    },
    removeEventListener: (type: string, listener: () => void) => {
      if (type === 'abort') {
        listeners.delete(listener);
      }
    },
    dispatchEvent: () => false,
    throwIfAborted: () => {
      if (signal.aborted) {
        throw signal.reason;
      }
    },
  };

  const abort = () => {
    if (signal.aborted) {
      return;
    }

    signal.aborted = true;
    signal.reason = new Error('The operation was aborted.');
    signal.onabort?.();
    listeners.forEach((listener) => listener());
  };

  return { signal: signal as unknown as AbortSignal, abort };
}
