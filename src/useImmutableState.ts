import { useState } from 'react';

export default function useImmutableState<T>(immutableValue?: T | (() => T)) {
  const [state] = useState<T>(immutableValue as T);

  return state;
}
