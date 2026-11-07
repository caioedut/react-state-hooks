# Changelog

## 2.0.0

A major rewrite focused on correctness, typing and a consistent API. Requires React 18 or newer.

### Breaking changes

- **Named exports only.** Use `import { useX } from 'react-state-hooks'`.
- **Build target:** the output is now ES2020 (it was ES5) and `react` `>=18` is required as a peer dependency. Modern bundlers, Metro and current Node versions handle it; if you target very old runtimes, transpile `node_modules`.
- **Package format:** now `"type": "module"` with an `exports` map. ESM and CJS builds are shipped (`dist/index.js`, `dist/index.cjs`) with matching types.
- **Contract:** the third item returned by a hook is always an object of extras.
- `useObjectState` returns `[value, patch, { set, reset }]`. `reset()` restores the **initial value** (it used to clear the object) and `initialState` is required.
- `useHistoryState`: `history` is an immutable array (a new one on every change), `rollback` was replaced by `undo` and `redo` (with `future`, `canUndo` and `canRedo`), and without an initial value you call it as `useHistoryState<T>()`.
- `useNumberState`: the initial value defaults to `0` and the state is always a `number`. `step` is counted from `min`.
- `useToggleState`: returns `[value, toggle]`; `toggle(boolean)` sets the value and non-boolean arguments are ignored.
- `useAsyncState`: the getter receives an `AbortSignal`; `setData` discards a run in flight.
- `useDebounceState`: returns `[value, setValue, { cancel, flush, isPending }]`.
- `useDependentState`: the factory receives `previous: T | undefined`; the state is derived during render.
- `useStoreState`: `null` is a valid value (it was treated as missing).
- `useImmutableState` requires its value.

### Added

- New hooks: `useSetState`, `useMapState`, `useThrottleState`, `useControllableState`, `useCycleState` and `usePreviousState`.
- `useHistoryState`: `undo`, `redo`, `future`, `canUndo` and `canRedo`.
- Exported types: `Initializer`, `Updater`, `SetState`, `NumberStateOptions`, `ObjectPatch`, `HistoryExtras`, `ThrottleOptions` and `ControllableStateOptions`.
- `useDebounceState` extras `cancel` and `flush`, and `isPending`.
- Full JSDoc for every hook, and a test suite with 100% coverage that also runs under `StrictMode`.

### Fixes

- `useDependentState`: no extra render on mount, the factory is no longer called on every render and function values are handled.
- `useStoreState`: lazy initial state, key changes and updaters before the first subscription now work; no mutation during render.
- `useDebounceState`: the timer is cleared on unmount and the setter is stable.
- `useAsyncState`: no more race conditions between runs and no update after unmount.
- `useHistoryState` / `useNumberState`: consecutive updates in the same batch no longer use a stale state, and `useNumberState` handles negative numbers and floating point steps.
- `usePropState`: no render with a stale value and lazy initial state is resolved.
- `useListState`: lazy initial list.

### Tooling

- Build: parcel -> tsdown. Lint and format: oxlint and oxfmt (prettier removed). Test: Vitest 5 and Testing Library 16 on React 19, with 100% coverage enforced.
- TypeScript 7 with a stricter `tsconfig` (`ES2022`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`); tests are now type-checked.
