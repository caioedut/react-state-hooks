let keyCounter = 0;

/** A store key that no other test uses, so tests never depend on each other's global state. */
export function uniqueKey(prefix = 'key') {
  keyCounter += 1;
  return `${prefix}-${keyCounter}`;
}

/** A promise that is settled from the outside. */
export function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}
