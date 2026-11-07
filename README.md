<div align="center">
  <h1>
    <br>
    ⚛️ React State Hooks
    <br>
  </h1>

  <p>
    <br>
    Small, typed and tested hooks for the state you write every day.
    <br>
    Debounce, history, lists, numbers, objects, props, global stores and async data.
    <br>
  </p>

  <p>
    <a href="https://www.npmjs.com/package/react-state-hooks"><img src="https://img.shields.io/npm/v/react-state-hooks.svg" alt="npm version" /></a>
    <img src="https://img.shields.io/npm/types/react-state-hooks" alt="TypeScript types included" />
  </p>
</div>

<br>

## Highlights

- **17 focused hooks** that follow the same conventions, so learning one means knowing them all.
- **Lightweight**: under 3 kB minified and gzipped for all 17 hooks, and each hook on its own is between 0.2 and 0.6 kB. Zero dependencies.
- **React and React Native**: no DOM APIs, only React 18+.
- **Typed**: written in TypeScript, with precise tuple types and overloads.
- **Safe by default**: no stale closures, no updates after unmount, no render with a stale value.
- **Tree-shakable** ESM and CommonJS builds, with `sideEffects: false`.
- **Fully tested**: 100% coverage, also under `StrictMode`.

## Installation

```sh
npm install react-state-hooks
```

```sh
yarn add react-state-hooks
```

```sh
bun add react-state-hooks
```

## Quick start

```tsx
import { useDebounceState, useListState, useToggleState } from 'react-state-hooks';

function Todos() {
  const [isOpen, toggleOpen] = useToggleState(false);
  const [query, setQuery, { isPending }] = useDebounceState('', 300);
  const [todos, { push, remove }] = useListState<string>([]);

  return (
    <>
      <button onClick={toggleOpen}>{isOpen ? 'Hide' : 'Show'}</button>

      {isOpen && (
        <>
          <input onChange={(e) => setQuery(e.target.value)} />
          {isPending ? 'Typing...' : `Searching for "${query}"`}

          <button onClick={() => push(query)}>Add</button>
          <ul>
            {todos.map((todo, index) => (
              <li key={todo} onClick={() => remove(index)}>
                {todo}
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
```

## Hooks

| Hook                                            | What it is for                                       | Returns                                                                |
| ----------------------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------------------- |
| [`useAsyncState`](#useasyncstate)               | Load a value from a promise                          | `[data, setData, { error, isPending, revalidate }]`                    |
| [`useControllableState`](#usecontrollablestate) | State that a parent can control, like a native input | `[value, setValue]`                                                    |
| [`useCycleState`](#usecyclestate)               | Walk through a list of values and wrap around        | `[value, { next, prev, set, index }]`                                  |
| [`useDebounceState`](#usedebouncestate)         | Apply updates after a delay without new changes      | `[value, setValue, { cancel, flush, isPending }]`                      |
| [`useDependentState`](#usedependentstate)       | State derived from dependencies, still overridable   | `[value, setValue]`                                                    |
| [`useHistoryState`](#usehistorystate)           | Undo and redo through the previous values            | `[value, setValue, { history, future, undo, redo, canUndo, canRedo }]` |
| [`useImmutableState`](#useimmutablestate)       | A value computed once and never changed              | `value`                                                                |
| [`useListState`](#useliststate)                 | An array with immutable helpers                      | `[list, actions]`                                                      |
| [`useMapState`](#usemapstate)                   | A `Map` with immutable helpers                       | `[map, actions]`                                                       |
| [`useNumberState`](#usenumberstate)             | A number with `min`, `max` and `step`                | `[value, setValue, { inc, dec }]`                                      |
| [`useObjectState`](#useobjectstate)             | An object updated by merging patches                 | `[value, patch, { set, reset }]`                                       |
| [`usePreviousState`](#usepreviousstate)         | The value before the last change                     | `previous`                                                             |
| [`usePropState`](#usepropstate)                 | Local state that follows a prop                      | `[value, setValue]`                                                    |
| [`useSetState`](#usesetstate)                   | A `Set` with immutable helpers                       | `[set, actions]`                                                       |
| [`useStoreState`](#usestorestate)               | A global state shared by key                         | `[value, setValue]`                                                    |
| [`useThrottleState`](#usethrottlestate)         | Apply updates at most once per interval              | `[value, setValue, { cancel, flush, isPending }]`                      |
| [`useToggleState`](#usetogglestate)             | A boolean                                            | `[value, toggle]`                                                      |

### Conventions

Every hook follows the same rules:

- **Named exports only**: `import { useX } from 'react-state-hooks'`.
- **Tuples**: a hook that wraps a value returns `[value, setValue, extras?]`. `extras` is always an object, never a bare function.
  - Hooks that manage a collection or only move through a fixed list have no free setter, so they return `[value, actions]`: `useListState`, `useMapState`, `useSetState` and `useCycleState`.
  - Two hooks are simpler by nature: `useToggleState` returns `[value, toggle]`, and `useImmutableState` and `usePreviousState` return just the value.
- **Setters behave like `useState`**: they accept a value or an updater function (`(previous) => next`), and updaters run in order inside the same batch.
- **Lazy initial values**: wherever an initial value is accepted, a function that returns it is accepted too, and it runs only once.
- **Stable functions**: setters and actions keep the same identity between renders, so they are safe in dependency arrays. The only exceptions depend on an input: `useHistoryState` (`length`), `useNumberState` (`min`, `max`, `step`) and `useStoreState` (`key`).
- **Immutable updates**: values are never mutated, and every change creates a new object or array.

---

### useAsyncState

Loads a value from a promise, on mount and again whenever the dependencies change.

```ts
useAsyncState<T>(getter: (signal: AbortSignal) => Promise<T>, deps?: DependencyList)
```

| Returned     | Description                                                         |
| ------------ | ------------------------------------------------------------------- |
| `data`       | The loaded value, or `undefined` while loading or after an error.   |
| `setData`    | Overrides the data (value or updater) and discards a run in flight. |
| `error`      | What the last run rejected with, or `undefined`.                    |
| `isPending`  | `true` while a run is in flight. Starts as `true`.                  |
| `revalidate` | Runs the getter again.                                              |

```tsx
const [user, setUser, { error, isPending, revalidate }] = useAsyncState(
  (signal) => fetch(`/users/${userId}`, { signal }).then((res) => res.json()),
  [userId],
);

revalidate(); // run again
setUser((current) => ({ ...current, name: 'Richard' })); // override manually
```

- Only the latest run updates the state: a slow old response never overwrites a newer one.
- The `signal` is aborted when a run becomes outdated (new run, deps change or unmount). Pass it to `fetch` to cancel the request.
- Works in the browser, Node and React Native. If the platform has no `AbortController`, a minimal signal is used instead, so the hook never throws because of it.
- On error the data is cleared and `error` is set. A later successful run clears the error.

---

### useControllableState

State that a parent can control, or that manages itself, the same way a native `<input>` works. It is the building block of reusable components such as selects, tabs and switches.

```ts
useControllableState<T>(options?: { value?: T; defaultValue?: T | (() => T); onChange?: (value: T) => void })
```

| Option         | Description                                                                      |
| -------------- | -------------------------------------------------------------------------------- |
| `value`        | The controlled value. While it is not `undefined`, the parent decides the value. |
| `defaultValue` | The initial value when uncontrolled (or a function that returns it).             |
| `onChange`     | Called with the new value whenever the setter changes it, controlled or not.     |

```tsx
type SwitchProps = { checked?: boolean; defaultChecked?: boolean; onChange?: (checked: boolean) => void };

function Switch({ checked, defaultChecked = false, onChange }: SwitchProps) {
  const [isOn, setIsOn] = useControllableState({ value: checked, defaultValue: defaultChecked, onChange });

  return <button onClick={() => setIsOn((current) => !current)}>{isOn ? 'On' : 'Off'}</button>;
}

<Switch />; // manages itself
<Switch checked={enabled} onChange={setEnabled} />; // controlled by the parent
```

- **Controlled** while `value` is not `undefined`: the returned value is always `value`, and the setter only calls `onChange`. It is up to the parent to pass the new value back.
- **Uncontrolled** otherwise: the hook keeps its own state, starting from `defaultValue`, and the setter updates it and also calls `onChange`.
- `onChange` is not called when the new value is the same as the current one. `null` counts as a controlled value.
- If a controlled component becomes uncontrolled, it keeps the last controlled value.

---

### useCycleState

State that walks through a fixed list of values and goes back to the first one after the last. Good for a theme, a sort order or a view mode.

```ts
useCycleState<T>(values: readonly [T, ...T[]], initialValue?: T)
```

| Returned        | Description                                                          |
| --------------- | -------------------------------------------------------------------- |
| `value`         | The current value.                                                   |
| `actions.next`  | Goes to the next value, or to the first one after the last.          |
| `actions.prev`  | Goes to the previous value, or to the last one before the first.     |
| `actions.set`   | `set(value)` goes to that value. Values not in the list are ignored. |
| `actions.index` | The position of the current value in the list.                       |

```tsx
const [theme, { next, set }] = useCycleState(['light', 'dark', 'system'] as const);

<button onClick={next}>Theme: {theme}</button>; // light -> dark -> system -> light
set('dark');
```

- `next` takes no arguments, so `onClick={next}` is safe: the event is ignored.
- Write the list `as const` (or pass the type) to get a union of literal types.
- The hook keeps the position, not the value, so passing an inline array on every render works.

---

### useDebounceState

A state whose updates are applied only after a delay without new calls.

```ts
useDebounceState<T>(initialValue: T | (() => T), delay = 500)
```

| Returned    | Description                                 |
| ----------- | ------------------------------------------- |
| `value`     | The debounced value.                        |
| `setValue`  | Schedules an update (value or updater).     |
| `cancel`    | Drops the pending update.                   |
| `flush`     | Applies the pending update immediately.     |
| `isPending` | `true` while an update waits for the delay. |

```tsx
const [query, setQuery, { cancel, flush, isPending }] = useDebounceState('', 300);

setQuery('react'); // `query` changes after 300ms without new calls
flush(); // ...or apply it now
cancel(); // ...or drop it
```

- Called several times within the delay, only the last call is applied.
- The timer is cleared on unmount.

---

### useDependentState

A state derived from dependencies: it is recomputed when a dependency changes and can still be overridden in between.

```ts
useDependentState<T>(factory: (previous: T | undefined) => T, deps?: DependencyList)
```

```tsx
const [filters, setFilters] = useDependentState(() => ({ userId, page: 1 }), [userId]);

// Go to page 2... until `userId` changes and the factory runs again
setFilters((current) => ({ ...current, page: 2 }));
```

- Derived during render: no render with a stale value and no extra render on mount.
- The factory receives the previous value (`undefined` on mount).
- Without `deps`, the value is computed only once.

---

### useHistoryState

A state that remembers its last values and can undo and redo them.

```ts
useHistoryState<T>(initialState: T | (() => T), length = 10)
useHistoryState<T>() // starts as undefined, with an empty history
```

| Returned   | Description                                                                 |
| ---------- | --------------------------------------------------------------------------- |
| `value`    | The current value.                                                          |
| `setValue` | Sets the value (value or updater) and adds it to the history.               |
| `history`  | Immutable list of values, oldest first. The last item is the current value. |
| `future`   | Immutable list of undone values that can be redone, the next one first.     |
| `undo`     | `undo(amount = 1)` goes back, never before the first value.                 |
| `redo`     | `redo(amount = 1)` goes forward through the undone values.                  |
| `canUndo`  | `true` when there is a previous value. Handy to disable a button.           |
| `canRedo`  | `true` when there is an undone value.                                       |

```tsx
const [value, setValue, { history, undo, redo, canUndo, canRedo }] = useHistoryState(0);

setValue(2); // value: 2, history: [0, 2]
setValue(3); // value: 3, history: [0, 2, 3]
undo(); // value: 2, history: [0, 2], future: [3]
redo(); // value: 3, history: [0, 2, 3], future: []
undo(5); // goes back as far as it can: value: 0
```

- Setting the same value as the current one does not add an entry.
- Setting a new value after an `undo` discards what could be redone.
- `history` and `future` are new arrays on every change.

---

### useImmutableState

A value computed once and never changed during the life of the component.

```ts
useImmutableState<T>(value: T | (() => T)): T
```

```tsx
const client = useImmutableState(() => createClient());
```

---

### useListState

An array with immutable helpers.

```ts
useListState<T>(initialState?: T[] | (() => T[]))
```

| Action                         | Description                                                       |
| ------------------------------ | ----------------------------------------------------------------- |
| `set(items)`                   | Replaces the list with a copy of `items`.                         |
| `push(...items)`               | Adds items to the end.                                            |
| `insert(index, item)`          | Inserts an item at `index` (negative indexes count from the end). |
| `remove(indexOrHandler)`       | Removes by index, or every item the handler returns `true` for.   |
| `update(indexOrHandler, item)` | Replaces by index, or every item the handler returns `true` for.  |
| `filter(predicate)`            | Keeps only the items that match.                                  |
| `sort(compareFn?)`             | Sorts a copy of the list.                                         |
| `clear()`                      | Empties the list.                                                 |

```tsx
const [todos, { push, remove, update, sort }] = useListState([{ id: 1, done: false }]);

push({ id: 2, done: false });
update((todo) => todo.id === 2, { id: 2, done: true });
remove((todo) => todo.done);
sort((a, b) => a.id - b.id);
```

- Out of bounds indexes are ignored by `remove` and `update`.

---

### useMapState

A `Map` with immutable helpers.

```ts
useMapState<K, V>(initialState?: Iterable<[K, V]> | (() => Iterable<[K, V]>))
```

| Action                 | Description                                                                 |
| ---------------------- | --------------------------------------------------------------------------- |
| `set(key, value)`      | Adds an entry, or replaces the value of an existing key.                    |
| `update(key, updater)` | Sets the value from the previous one (`undefined` when the key is missing). |
| `remove(...keys)`      | Removes entries.                                                            |
| `replace(entries)`     | Replaces the whole map.                                                     |
| `clear()`              | Empties the map.                                                            |

```tsx
const [users, { set, update, remove }] = useMapState<number, { name: string }>();

set(1, { name: 'Richard' });
update(1, (user) => ({ ...user, name: 'Ward' }));
users.get(1); // { name: 'Ward' }
remove(1);
```

- Every change creates a new `Map`. Actions that change nothing keep the same one and don't re-render.
- The `Map` is read-only in the types: change it through the actions.

---

### useNumberState

A number with optional `min`, `max` and `step`.

```ts
useNumberState(initialState = 0, options?: { min?: number; max?: number; step?: number })
```

| Returned   | Description                                                     |
| ---------- | --------------------------------------------------------------- |
| `value`    | The current number. Always a `number`.                          |
| `setValue` | Sets the value (value or updater). The rules are applied to it. |
| `inc`      | `inc(amount?)` adds `amount`. Defaults to `step`, or `1`.       |
| `dec`      | `dec(amount?)` subtracts `amount`. Defaults to `step`, or `1`.  |

```tsx
const [quantity, setQuantity, { inc, dec }] = useNumberState(1, { min: 1, max: 10 });

inc(); // 2
dec(5); // 1 (clamped to min)
setQuantity(100); // 10 (clamped to max)
```

- Rules run in order: clamp to `[min, max]`, then floor to a multiple of `step` (counted from `min`).
- Floating point steps like `0.1` don't accumulate errors.
- Passing the options inline is fine: functions keep their identity until `min`, `max` or `step` change.

---

### useObjectState

An object updated by merging patches.

```ts
useObjectState<T extends object>(initialState: T | (() => T))
```

| Returned | Description                                                                |
| -------- | -------------------------------------------------------------------------- |
| `value`  | The current object.                                                        |
| `patch`  | Shallow-merges a partial object, or the result of `(previous) => partial`. |
| `set`    | Replaces the whole object.                                                 |
| `reset`  | Restores the initial object.                                               |

```tsx
const [user, patch, { set, reset }] = useObjectState({ name: 'Richard', age: 20 });

patch({ age: 21 }); // merge
patch((current) => ({ age: current.age + 1 })); // merge based on the previous value
set({ name: 'Ward', age: 30 }); // replace
reset(); // back to { name: 'Richard', age: 20 }
```

---

### usePreviousState

The value that came before the current one.

```ts
usePreviousState<T>(value: T): T | undefined
```

```tsx
const previousCount = usePreviousState(count);

// count: 0 -> previousCount: undefined
// count: 3 -> previousCount: 0
// re-render with count: 3 -> previousCount: 0
const direction = previousCount === undefined ? 'none' : count > previousCount ? 'up' : 'down';
```

- It returns the previous **distinct** value: re-rendering with the same value does not make the previous value become the current one.
- It is derived during render, so it is already correct in the same render in which `value` changes.
- For state you own and want to go back to, [`useHistoryState`](#usehistorystate) also lets you undo and redo.

---

### usePropState

Local state that follows a prop.

```ts
usePropState<T>(prop: T | undefined, initialState?: T | (() => T))
```

```tsx
function NameField({ name }: { name?: string }) {
  const [value, setValue] = usePropState(name, 'Richard');

  return <input value={value} onChange={(e) => setValue(e.target.value)} />;
}
```

- Whenever `prop` changes to a defined value, the state is replaced by it. Local changes are kept while the prop stays the same.
- While `prop` is `undefined`, the state is left as it is.
- Synced during render: there is never a render with a stale value.

---

### useSetState

A `Set` with immutable helpers.

```ts
useSetState<T>(initialState?: Iterable<T> | (() => Iterable<T>))
```

| Action                 | Description                                                           |
| ---------------------- | --------------------------------------------------------------------- |
| `add(...items)`        | Adds items.                                                           |
| `remove(...items)`     | Removes items.                                                        |
| `toggle(item, force?)` | Adds the item when missing, removes it when present. `force` sets it. |
| `replace(items)`       | Replaces the whole set.                                               |
| `clear()`              | Empties the set.                                                      |

```tsx
const [selected, { toggle, add, remove, clear }] = useSetState<number>();

toggle(1); // Set { 1 }
add(2, 3); // Set { 1, 2, 3 }
remove(1); // Set { 2, 3 }
selected.has(2); // true
```

- Every change creates a new `Set`. Actions that change nothing keep the same one and don't re-render.
- The `Set` is read-only in the types: change it through the actions.

---

### useStoreState

A global state shared by every component that uses the same key.

```ts
useStoreState<T>(key: string, initialState?: T | (() => T))
```

```tsx
// Anywhere in the app
const [theme, setTheme] = useStoreState('theme', 'light');

setTheme((current) => (current === 'light' ? 'dark' : 'light'));
```

- The initial state is only used by the first hook that touches a key.
- The value is kept after every component unmounts, for as long as the module lives.
- Built on `useSyncExternalStore`. `null` is a valid value, and setting the same value does not re-render anything.
- On the server the store is shared by every request, so don't keep user specific data in it.

---

### useThrottleState

A state whose updates are applied at most once every `interval` milliseconds.

```ts
useThrottleState<T>(initialValue: T | (() => T), interval = 500, options?: { leading?: boolean; trailing?: boolean })
```

| Returned    | Description                                           |
| ----------- | ----------------------------------------------------- |
| `value`     | The throttled value.                                  |
| `setValue`  | Requests an update (value or updater).                |
| `cancel`    | Drops the held update and ends the interval.          |
| `flush`     | Applies the held update now and ends the interval.    |
| `isPending` | `true` while an update waits for the interval to end. |

```tsx
const [scrollY, setScrollY] = useThrottleState(0, 100);

// `scrollY` follows the scroll, but changes at most every 100ms
<ScrollView onScroll={(e) => setScrollY(e.nativeEvent.contentOffset.y)} />;
```

- A debounce waits for the calls to stop. A throttle keeps applying updates while the calls continue.
- By default the first call is applied right away (`leading`) and the last one received during the interval is applied when it ends (`trailing`). Turn either off with the options.
- The timer is cleared on unmount.

---

### useToggleState

A boolean with a single `toggle` function.

```ts
useToggleState(initialState: boolean | (() => boolean) = false)
```

```tsx
const [isOpen, toggleOpen] = useToggleState(false);

toggleOpen(); // flip
toggleOpen(true); // set

<button onClick={toggleOpen} />; // events are ignored, so it just flips
```

## TypeScript

Everything is typed and inferred from your arguments. A few things worth knowing:

- Hooks that can start without a value need the type spelled out, because there is nothing to infer it from:

  ```ts
  const [value, setValue] = useHistoryState<number>(); // value: number | undefined
  const [count] = useStoreState<number>('count'); // count: number | undefined
  ```

- `useNumberState` always returns a `number`, and `useObjectState` requires an object type.
- The helper types are exported: `Initializer<T>`, `Updater<T>`, `SetState<T>`, `NumberStateOptions`, `ObjectPatch<T>`, `HistoryExtras<T>`, `ThrottleOptions` and `ControllableStateOptions<T>`.

  ```ts
  import type { SetState } from 'react-state-hooks';

  function Controls({ setCount }: { setCount: SetState<number> }) {}
  ```

## Compatibility

Using the library only needs what your app already has.

| What                  | Requirement                                                                                           |
| --------------------- | ----------------------------------------------------------------------------------------------------- |
| React                 | 18 or newer (`peerDependency`).                                                                       |
| TypeScript (optional) | The published types compile from TypeScript 4.9 up to the latest, in `strict` mode.                   |
| Runtime               | Browsers, Node, React Native. The build is ES2020 and only uses `Map`, `Set`, `Object.is` and timers. |
| Module format         | ESM and CommonJS, with types for both. Works with `node10`, `node16` and `bundler` resolution.        |

## Migrating from v1

Version 2 is a major release with breaking changes (named exports, new return shapes for `useObjectState`, `useDebounceState` and `useToggleState`, and more). See the [changelog](./CHANGELOG.md) for the full list and the fixes that came with it.

## License

MIT © [Caio Teixeira](https://github.com/caioedut)
