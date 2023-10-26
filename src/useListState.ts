import { useCallback, useMemo, useReducer, useRef } from 'react';

export default function useListState<T>(initialState?: T[]) {
  const listRef = useRef(initialState ?? []);

  const [_, render] = useReducer((current) => !current, false);

  const set = useCallback(
    (items: T[]) => {
      listRef.current.splice(0, listRef.current.length, ...items);
      render();
    },
    [listRef.current],
  );

  const actions = useMemo(
    () => ({
      push: (...items: T[]) => {
        set([...listRef.current, ...items]);
      },

      insert: (index: number, item: T) => {
        listRef.current.splice(index, 0, item);
        set(listRef.current);
      },

      remove: (indexOrHandler: number | ((item: T, index: number) => boolean)) => {
        if (typeof indexOrHandler === 'function') {
          indexOrHandler = listRef.current.findIndex(indexOrHandler);
        }

        set(listRef.current.filter((_, index) => index !== indexOrHandler));
      },

      update: (indexOrHandler: number | ((item: T, index: number) => boolean), newItem: T) => {
        if (typeof indexOrHandler === 'function') {
          indexOrHandler = listRef.current.findIndex(indexOrHandler);
        }

        set(listRef.current.map((item, index) => (index === indexOrHandler ? newItem : item)));
      },

      clear: () => {
        set([]);
      },

      sort: (compareFn?: (a: T, b: T) => number) => {
        listRef.current.sort(compareFn);
        set(listRef.current);
      },

      filter: (predicate: (value: T, index: number, array: T[]) => boolean) => {
        set(listRef.current.filter(predicate));
      },
    }),
    [listRef.current, set],
  );

  return [listRef.current, { set, ...actions }] as const;
}
