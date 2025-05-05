import { useMemo, useState } from 'react';

export default function useListState<T>(initialState: T[] = []) {
  const [list, setList] = useState<T[]>(initialState);

  const actions = useMemo(
    () => ({
      set: (items: T[]) => {
        setList([...items]);
      },

      push: (...items: T[]) => {
        setList((prev) => [...prev, ...items]);
      },

      insert: (index: number, item: T) => {
        setList((prev) => {
          const next = [...prev];
          next.splice(index, 0, item);
          return next;
        });
      },

      remove: (indexOrHandler: number | ((item: T, index: number) => boolean)) => {
        setList((prev) => {
          return typeof indexOrHandler === 'function'
            ? prev.filter((item, index) => !indexOrHandler(item, index)) // Remove todas as ocorrências se for uma função
            : prev.filter((_, i) => i !== indexOrHandler); // Remove pelo índice
        });
      },

      update: (indexOrHandler: number | ((item: T, index: number) => boolean), newItem: T) => {
        setList((prev) => {
          return typeof indexOrHandler === 'function'
            ? prev.map((item, index) => (indexOrHandler(item, index) ? newItem : item)) // Atualiza baseado na função
            : prev.map((item, index) => (index === indexOrHandler ? newItem : item)); // Atualiza pelo índice
        });
      },

      clear: () => {
        setList([]);
      },

      sort: (compareFn?: (a: T, b: T) => number) => {
        setList((prev) => [...prev].sort(compareFn));
      },

      filter: (predicate: (value: T, index: number, array: T[]) => boolean) => {
        setList((prev) => prev.filter(predicate));
      },
    }),
    [],
  );

  return [list, actions] as const;
}
