export type AnyObject = {
  [key: string | number]: any;
};

export type SetStateParam<T> = T | ((current?: T) => T);
