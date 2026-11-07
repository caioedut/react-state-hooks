import { describe, expect, test } from 'vitest';
import * as api from '../src';

describe('public API', () => {
  test('should export every hook by name, and nothing else at runtime', () => {
    expect(Object.keys(api).sort()).toEqual([
      'useAsyncState',
      'useControllableState',
      'useCycleState',
      'useDebounceState',
      'useDependentState',
      'useHistoryState',
      'useImmutableState',
      'useListState',
      'useMapState',
      'useNumberState',
      'useObjectState',
      'usePreviousState',
      'usePropState',
      'useSetState',
      'useStoreState',
      'useThrottleState',
      'useToggleState',
    ]);
  });

  test.each(Object.entries(api))('%s should be a function', (_name, hook) => {
    expect(typeof hook).toBe('function');
  });

  test('should not have a default export', () => {
    expect('default' in api).toBe(false);
  });
});
