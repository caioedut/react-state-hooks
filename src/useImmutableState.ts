import { useState } from 'react';
import type { Initializer } from './types';

/**
 * A value that is computed once and never changes for the lifetime of the component.
 *
 * Useful for instances that must be created lazily and kept stable (clients, caches, ids).
 *
 * @typeParam T - Type of the value.
 * @param immutableValue - The value, or a function that returns it. The function runs only once.
 * @returns The value from the first render; later arguments are ignored.
 *
 * @example
 * ```tsx
 * const client = useImmutableState(() => createClient());
 * ```
 */
export function useImmutableState<T>(immutableValue: Initializer<T>): T {
  const [state] = useState(immutableValue);

  return state;
}
