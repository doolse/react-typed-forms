import React, {
  ChangeEvent,
  DependencyList,
  FC,
  ReactElement,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  addAfterChangesCallback,
  collectChanges,
  controlGroup,
  getCurrentElems,
  getElems,
  getFields,
  newControl,
  newElement,
  setFields,
  trackControlChange,
  updateElems,
  ValueAndDeps,
} from "./controlImpl";
import {
  ChangeListenerFunc,
  Control,
  ControlChange,
  ControlSetup,
  ControlValue,
} from "./types";

export function useControlEffect<V>(
  compute: () => V,
  onChange: (value: V) => void,
  initial?: ((value: V) => void) | boolean
) {
  const lastRef = useRef<[ValueAndDeps<V>, ChangeListenerFunc<any>]>();

  function checkEffect(onlyDeps?: boolean) {
    const [res, deps] = collectChanges(compute);
    const c = lastRef.current;
    if (c) {
      const [[oldRes, oldDeps], oldListener] = c;
      const depsChanged =
        oldDeps.length !== deps.length || deps.some((x, i) => x !== oldDeps[i]);
      if (oldRes !== res && (!onlyDeps || depsChanged)) {
        onChange(res);
      }
      if (depsChanged) {
        removeListeners(oldListener, oldDeps);
        const listener = makeAfterChangeListener(checkEffect);
        attachListeners(listener, deps);
        lastRef.current = [[res, deps], listener];
      }
    } else {
      typeof initial === "function"
        ? initial(res)
        : initial
        ? onChange(res)
        : undefined;
      const listener = makeAfterChangeListener(checkEffect);
      attachListeners(listener, deps);
      lastRef.current = [[res, deps], listener];
    }
  }

  useEffect(() => checkEffect(true));
  useEffect(() => {
    return () => {
      const c = lastRef.current;
      if (c) {
        removeListeners(c[1], c[0][1]);
      }
    };
  }, []);
}

export function useValueChangeEffect<V>(
  control: Control<V>,
  changeEffect: (control: V) => void,
  debounce?: number,
  runInitial?: boolean
) {
  const effectRef = useRef<[(control: V) => void, any, number?]>([
    changeEffect,
    undefined,
    debounce,
  ]);
  effectRef.current[0] = changeEffect;
  effectRef.current[2] = debounce;
  useEffect(() => {
    const updater = (c: Control<V>) => {
      const r = effectRef.current;
      if (r[2]) {
        if (r[1]) clearTimeout(r[1]);
        r[1] = setTimeout(() => {
          effectRef.current[0](c.current.value);
        }, r[2]);
      } else {
        r[0](c.value);
      }
    };
    runInitial ? updater(control) : undefined;
    control.addChangeListener(updater, ControlChange.Value);
    return () => control.removeChangeListener(updater);
  }, [control]);
}

export interface FormArrayProps<V> {
  state: Control<V[] | undefined>;
  children: (elems: Control<V>[]) => ReactNode;
}

export function FormArray<V>({ state, children }: FormArrayProps<V>) {
  return (
    <>
      {useControlValue(() =>
        state.isNonNull() ? children(getElems(state)) : null
      )}
    </>
  );
}

export function renderAll<V>(
  render: (c: Control<V>, index: number) => ReactNode
): (elems: Control<V>[]) => ReactNode {
  return (e) => e.map(render);
}

export function useAsyncValidator<V>(
  control: Control<V>,
  validator: (
    control: Control<V>,
    abortSignal: AbortSignal
  ) => Promise<string | null | undefined>,
  delay: number,
  validCheckValue: (control: Control<V>) => any = (c) => c.value
) {
  const handler = useRef<number>();
  const abortController = useRef<AbortController>();
  useControlEffect(
    () => {
      trackControlChange(control, ControlChange.Validate);
      return validCheckValue(control);
    },
    (currentVersion) => {
      if (handler.current) {
        window.clearTimeout(handler.current);
      }
      if (abortController.current) {
        abortController.current.abort();
      }
      handler.current = window.setTimeout(() => {
        const aborter = new AbortController();
        abortController.current = aborter;
        validator(control, aborter.signal)
          .then((error) => {
            const [live] = collectChanges(() => validCheckValue(control));
            if (live === currentVersion) {
              control.touched = true;
              control.error = error;
            }
          })
          .catch((e) => {
            if (
              !(e instanceof DOMException && e.code == DOMException.ABORT_ERR)
            ) {
              throw e;
            }
          });
      }, delay);
    }
  );
}

export interface FormControlProps<V, E extends HTMLElement> {
  value: V;
  onChange: (e: ChangeEvent<E & { value: any }>) => void;
  onBlur: () => void;
  disabled: boolean;
  errorText?: string | null;
  ref: (elem: HTMLElement | null) => void;
}

export function genericProps<V, E extends HTMLElement>(
  state: Control<V>
): FormControlProps<V, E> {
  const error = state.error;
  const valid = state.valid;
  return {
    ref: (elem) => {
      state.element = elem;
    },
    value: state.value,
    disabled: state.disabled,
    errorText: state.touched && !valid ? error : undefined,
    onBlur: () => (state.touched = true),
    onChange: (e) => (state.value = e.target.value),
  };
}

export function useControl<V, M = any>(
  initialState: V | (() => V),
  configure?: ControlSetup<V, M>,
  afterInit?: (c: Control<V>) => void
): Control<V>;

export function useControl<V = undefined>(): Control<V | undefined>;

export function useControl(
  v?: any,
  configure?: ControlSetup<any, any>,
  afterInit?: (c: Control<any>) => void
): Control<any> {
  return useState(() => {
    const rv = typeof v === "function" ? v() : v;
    const c = newControl(rv, configure);
    return afterInit?.(c) ?? c;
  })[0];
}

export interface SelectionGroup<V> {
  selected: boolean;
  value: V;
}

interface SelectionGroupCreator<V> {
  makeElem: (v: V, iv: V) => Control<V>;
  makeGroup: (
    selected: boolean,
    wasSelected: boolean,
    value: Control<V>
  ) => Control<SelectionGroup<V>>;
}

type SelectionGroupSync<V> = (
  elems: Control<V>[],
  initialValue: V[],
  groupCreator: SelectionGroupCreator<V>
) => Control<SelectionGroup<V>>[];

const defaultSelectionCreator: SelectionGroupSync<any> = (
  elems,
  initialValue,
  creator
) => {
  return elems.map((x, i) => {
    return creator.makeGroup(true, true, x);
  });
};

export function ensureSelectableValues<V>(
  values: V[],
  key: (v: V) => any,
  parentSync: SelectionGroupSync<V> = defaultSelectionCreator as unknown as SelectionGroupSync<V>
): SelectionGroupSync<V> {
  return (elems, initialValue, groupCreator) => {
    const newFields = parentSync(elems, initialValue, groupCreator);
    values.forEach((av) => {
      const thisKey = key(av);
      if (
        !newFields.some(
          (x) => thisKey === key(getFields(x).value.current.value)
        )
      ) {
        newFields.push(
          groupCreator.makeGroup(false, false, groupCreator.makeElem(av, av))
        );
      }
    });
    return newFields;
  };
}

export function useSelectableArray<V>(
  control: Control<V[]>,
  groupSyncer: SelectionGroupSync<V> = defaultSelectionCreator as unknown as SelectionGroupSync<V>
): Control<SelectionGroup<V>[]> {
  const selectable = useControl<SelectionGroup<V>[]>([]);
  const updatedWithRef = useRef<Control<V>[] | undefined>(undefined);
  const selectChangeListener = useCallback(() => {
    const selectedElems = getCurrentElems(selectable)
      .filter((x) => getFields(x).selected.current.value)
      .map((x) => getFields(x).value);
    updatedWithRef.current = selectedElems;
    updateElems(control, () => selectedElems);
  }, [selectable, updatedWithRef, control]);
  useControlEffect(
    () => [control.value, control.initialValue],
    () => {
      const allControlElems = getCurrentElems(control);
      if (updatedWithRef.current === allControlElems) return;
      const selectableElems = groupSyncer(
        allControlElems,
        control.current.initialValue,
        {
          makeElem: (v, iv) => {
            const c = newElement(control, v);
            c.initialValue = iv;
            return c;
          },
          makeGroup: (isSelected, wasSelected, value) => {
            const selected = newControl(isSelected, undefined, wasSelected);
            selected.addChangeListener(
              selectChangeListener,
              ControlChange.Value
            );
            return controlGroup({
              selected,
              value,
            });
          },
        }
      );
      updateElems(selectable, () => selectableElems);
      updatedWithRef.current = allControlElems;
    },
    true
  );
  return selectable;
}

function removeListeners(
  listener: ChangeListenerFunc<any>,
  deps: (Control<any> | ControlChange)[]
) {
  for (let i = 0; i < deps.length; i++) {
    const depC = deps[i++] as Control<any>;
    depC.removeChangeListener(listener);
  }
}

function attachListeners(
  listener: ChangeListenerFunc<any>,
  deps: (Control<any> | ControlChange)[]
) {
  for (let i = 0; i < deps.length; i++) {
    const depC = deps[i++] as Control<any>;
    const depChange = deps[i] as ControlChange;
    depC.addChangeListener(listener, depChange);
  }
}

function makeAfterChangeListener(effect: () => void): ChangeListenerFunc<any> {
  let afterCbAdded = false;
  return () => {
    if (!afterCbAdded) {
      afterCbAdded = true;
      addAfterChangesCallback(() => {
        effect();
        afterCbAdded = false;
      });
    }
  };
}

function useAfterChangesEffect(
  initial: () => void,
  changeEffect: () => void,
  deps: (Control<any> | ControlChange)[]
) {
  useEffect(() => {
    initial();
    const listener = makeAfterChangeListener(changeEffect);
    attachListeners(listener, deps);
    return () => removeListeners(listener, deps);
  }, deps);
}

export function useControlValue<V>(control: Control<V>): V;

export function useControlValue<V>(stateValue: (previous?: V) => V): V;

export function useControlValue<V>(
  controlOrValue: Control<V> | ((previous?: V) => V)
) {
  const stateValue =
    typeof controlOrValue === "function"
      ? controlOrValue
      : () => controlOrValue.value;
  const prevRef = useRef<V>();
  const [currentVal, deps] = collectChanges(() => stateValue(prevRef.current));
  prevRef.current = currentVal;
  const [, setChangeCount] = useState(0);
  useAfterChangesEffect(
    () => {},
    () => setChangeCount((x) => x + 1),
    deps
  );
  return currentVal;
}

export function useComputed<V>(compute: () => V): Control<V> {
  const c = useControl(() => collectChanges(compute)[0]);
  useControlEffect(compute, (v) => (c.value = v), true);
  return c;
}

export function useControlGroup<C extends { [k: string]: any }>(
  fields: C,
  deps?: DependencyList
): Control<{ [K in keyof C]: ControlValue<C[K]> }> {
  const newControl = useState(() => controlGroup(fields))[0];
  useEffect(() => {
    setFields(newControl, fields);
  }, deps ?? Object.values(fields));
  return newControl;
}

export function usePreviousValue<V>(
  control: Control<V>
): Control<{ previous?: V; current: V }> {
  const withPrev = useControl<{ previous?: V; current: V }>(() => ({
    current: control.current.value,
  }));
  useControlEffect(
    () => control.value,
    (nextValue) =>
      withPrev.setValue(({ current }) => ({
        previous: current,
        current: nextValue,
      }))
  );
  return withPrev;
}

export function RenderControl({ children }: { children: () => ReactNode }) {
  return <>{useControlValue(children)}</>;
}

export function RenderValue<V>({
  toValue,
  children,
}: {
  toValue: (previous?: V) => V;
  children: (v: V) => ReactNode;
}) {
  const v = useControlValue(toValue);
  return <>{children(v)}</>;
}

export function RenderForm<V, E extends HTMLElement = HTMLElement>({
  control,
  children,
}: {
  control: Control<V>;
  children: (fcp: FormControlProps<V, E>) => ReactNode;
}) {
  return <>{useControlValue(() => children(genericProps<V, E>(control)))}</>;
}

/**
 * @deprecated
 */
export function useControlState<V, S>(
  control: Control<V>,
  toState: (state: Control<V>, previous?: S) => S
): S {
  return useControlValue((p) => toState(control, p));
}

/**
 * @deprecated
 */
export function useControlStateComponent<V, S>(
  control: Control<V>,
  toState: (state: Control<V>) => S
): FC<{ children: (formState: S) => ReactElement }> {
  return useMemo(
    () =>
      ({ children }) => {
        const state = useControlValue(() => toState(control));
        return children(state);
      },
    []
  );
}

/**
 * @deprecated
 */
export function useControlChangeEffect<V>(
  control: Control<V>,
  changeEffect: (control: Control<V>) => void,
  mask?: ControlChange,
  deps?: any[],
  runInitial?: boolean
) {
  useControlEffect(
    () => trackControlChange(control, mask ?? ControlChange.All),
    () => changeEffect(control),
    runInitial
  );
}
