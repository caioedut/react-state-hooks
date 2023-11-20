import { useRef, useState } from 'react';

export default function useImmutableState<T>(immutableValue?: T | (() => T)) {
  const [state] = useState<T | undefined>(immutableValue);

  return state;
}
