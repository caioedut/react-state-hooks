<div align="center">
  <h1>⚛️ React State Hooks</h1>
  <p>Collection of hooks to manage state.</p>

  <br><hr><br>

  <a href="https://www.npmjs.com/package/react-state-hooks">
   <img src="https://img.shields.io/npm/v/react-state-hooks.svg" alt="NPM" />
  </a>

  <pre>npm install react-state-hooks</pre>
</div>

<br><hr><br>

## Hooks

### `useObjectState`
```jsx
// useObjectState<T>(initialState?: T)

// Example:
const [obj, updateObj, resetObj] = useObjectState({ name: 'Richard' })

// Update
updateObj({ age: 21 });

// Reset
resetObj({});
```

### `usePropState`
```jsx
// usePropState<T>(prop: T | undefined, initialState?: T | (() => T))

// Example:
const [name, setName] = usePropState(props.name, 'Richard')
```
