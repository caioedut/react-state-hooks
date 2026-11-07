import { useCallback, useEffect, useRef, useState } from 'react';
import type { Initializer, SetState } from './types';
import { resolveInitializer, resolveUpdater } from './utils';

/** Options of `useControllableState`. */
export type ControllableStateOptions<T> = {
  /** The controlled value. While it is not `undefined`, the parent decides the value. */
  value?: T | undefined;
  /** The initial value when uncontrolled, or a function that returns it. */
  defaultValue?: Initializer<T> | undefined;
  /** Called with the new value whenever the setter changes it, controlled or not. */
  onChange?: ((value: T) => void) | undefined;
};

/**
 * State that can be controlled by a parent (through `value`) or manage itself (through `defaultValue`),
 * the same way a native `<input>` works. It is the building block of reusable components such as selects,
 * tabs and toggles.
 *
 * @typeParam T - Type of the state.
 * @param options - {@link ControllableStateOptions | The controlled value, the default value and the change handler}.
 * @returns A tuple `[value, setValue]`, like `useState`.
 *
 * @remarks
 * - **Controlled** while `value` is not `undefined`: the returned value is always `value`, and the setter only
 *   calls `onChange`. It is up to the parent to pass the new value back.
 * - **Uncontrolled** otherwise: the hook keeps its own state, starting from `defaultValue`, and the setter
 *   updates it and also calls `onChange`.
 * - `onChange` is not called when the new value is the same as the current one (`Object.is`).
 * - An updater function receives the current value. Inside the same batch, an uncontrolled state chains
 *   updaters; a controlled one only sees the new value once the parent passes it back.
 * - If a controlled component becomes uncontrolled, it keeps the last controlled value.
 * - `null` counts as a controlled value; only `undefined` means uncontrolled.
 * - `setValue` keeps the same identity between renders.
 *
 * @example
 * ```tsx
 * type SwitchProps = { checked?: boolean; defaultChecked?: boolean; onChange?: (checked: boolean) => void };
 *
 * function Switch({ checked, defaultChecked = false, onChange }: SwitchProps) {
 *   const [isOn, setIsOn] = useControllableState({ value: checked, defaultValue: defaultChecked, onChange });
 *
 *   return <button onClick={() => setIsOn((current) => !current)}>{isOn ? 'On' : 'Off'}</button>;
 * }
 *
 * <Switch />; // manages itself
 * <Switch checked={enabled} onChange={setEnabled} />; // controlled by the parent
 * ```
 */
export function useControllableState<T>(
  options: ControllableStateOptions<T> & { defaultValue: Initializer<T> },
): readonly [T, SetState<T>];
/**
 * Same as above, for a component that is always controlled: there is a `value` and no `defaultValue`,
 * so the returned value is never `undefined`.
 *
 * @param options - The controlled value and the change handler.
 */
export function useControllableState<T>(options: ControllableStateOptions<T> & { value: T }): readonly [T, SetState<T>];
/**
 * Same as above, without a `defaultValue`: while uncontrolled the value starts as `undefined`.
 *
 * @param options - The controlled value and the change handler.
 */
export function useControllableState<T>(
  options?: ControllableStateOptions<T>,
): readonly [T | undefined, SetState<T | undefined>];
export function useControllableState<T>({ value, defaultValue, onChange }: ControllableStateOptions<T> = {}) {
  const isControlled = value !== undefined;

  const [internal, setInternal] = useState<T | undefined>(() => {
    if (isControlled) {
      return value;
    }

    return defaultValue === undefined ? undefined : resolveInitializer(defaultValue);
  });

  // While controlled, the internal state follows the value, so nothing jumps if it becomes uncontrolled later
  if (isControlled && !Object.is(internal, value)) {
    setInternal(value);
  }

  const current = isControlled ? value : internal;

  const currentRef = useRef(current);
  const onChangeRef = useRef(onChange);
  const isControlledRef = useRef(isControlled);

  useEffect(() => {
    currentRef.current = current;
    onChangeRef.current = onChange;
    isControlledRef.current = isControlled;
  });

  const setValue: SetState<T | undefined> = useCallback((action) => {
    const next = resolveUpdater(action, currentRef.current);

    if (Object.is(next, currentRef.current)) {
      return;
    }

    if (!isControlledRef.current) {
      // Keeps chained updaters in the same batch working, since the effect above only runs after rendering
      currentRef.current = next;
      setInternal(next);
    }

    onChangeRef.current?.(next as T);
  }, []);

  return [current, setValue] as const;
}
