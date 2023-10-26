import { useReducer } from 'react';

export default function useToggleState(initialState = false) {
  return useReducer((current) => !current, initialState);
}
