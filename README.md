<div align="center">
  <h1>
    <br>
    ⚛️ React State Hooks
    <br>
  </h1>

  <p>
    <br>
    Collection of hooks to manage state.
    <br>
  </p>

  <a href="https://www.npmjs.com/package/react-state-hooks">
   <img src="https://img.shields.io/npm/v/react-state-hooks.svg" alt="NPM" />
  </a>
</div>

<br>
---
<br>

## Hooks

### useListState
```jsx
// useListState<T>(initialState?: T[])

// Example:
const [list, { set, push, insert, remove, update, clear, sort, filter }] = useListState({ name: 'Richard' })

// Reset
set([1, 2])

// Add
push(3, 4, 5, 6)

// Insert at index
insert(0, 'Hello')

// Remove
remove(0) // by index
remove((item) => item.id === 5) // by handler

// Update
update(0, { name: 'Richard' }) // by index
update((item) => item.id === 5, { name: 'Richard' }) // by handler

// Clear
clear()

// Sort
sort()
sort((a, b) => a.age - b.age)

// Filter
filter((item) => item.age > 21)

```

---

### useNumberState
```jsx
// useNumberState(initialState?: number, options?: { min?: number, max?: number, step?: number })

// Example:
const [number, setNumber, { inc, dec }] = useNumberState(0)

// Increment
inc(10)

// Decrement
dec(10)

// Options
const [...] = useNumberState(0, { min: 2, max: 10, step: 2 })
```

---

### useObjectState
```jsx
// useObjectState<T>(initialState?: T)

// Example:
const [obj, updateObj, resetObj] = useObjectState({ name: 'Richard' })

// Update
updateObj({ age: 21 });

// Reset
resetObj({});
```

---

### usePropState
```jsx
// usePropState<T>(prop: T | undefined, initialState?: T | (() => T))

// Example:
const [name, setName] = usePropState(props.name, 'Richard')
```

---

### useStoreState

Used to create and manage global states.

```jsx
// useStoreState<T>(key: string, initialState?: T | (() => T))

// Example:
const [name, setName] = useStoreState('user.name', 'Richard')
```

---

### useToggleState
```jsx
// useToggleState(initialState?: boolean)

// Example:
const [isVisible, togleIsVisible] = useToggleState(false)
```
