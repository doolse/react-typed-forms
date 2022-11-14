import React, {
  ChangeEvent,
  DependencyList,
  FC,
  PropsWithChildren,
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
  controlGroup,
  getElems,
  getFields,
  newControl,
  newElement,
  setFields,
  updateElems,
} from "./controlImpl";
import {
  ChangeListenerFunc,
  Control,
  ControlChange,
  ControlSetup,
  ControlValue,
} from "./types";

export function useControlChangeEffect<V>(
  control: Control<V>,
  changeEffect: (control: Control<V>, change: ControlChange) => void,
  mask?: ControlChange,
  deps?: any[],
  runInitial?: boolean
) {
  const effectRef = useRef<
    [(control: Control<V>, change: ControlChange) => void, Control<V>]
  >([changeEffect, control]);
  effectRef.current[0] = changeEffect;
  useEffect(() => {
    if (runInitial || control !== effectRef.current[1])
      effectRef.current[0](control, 0);
    effectRef.current[1] = control;
    const changeListener = (c: Control<V>, m: ControlChange) => {
      effectRef.current[0](c, m);
    };
    control.addChangeListener(changeListener, mask);
    return () => control.removeChangeListener(changeListener);
  }, deps ?? [control, mask]);
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
          effectRef.current[0](c.value);
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

export function useControlState<V, S>(
  control: Control<V>,
  toState: (state: Control<V>, previous?: S) => S,
  mask?: ControlChange,
  deps?: any[]
): S {
  const [state, setState] = useState(() => toState(control));
  useControlChangeEffect(
    control,
    (control) => setState((p) => toState(control, p)),
    mask,
    deps,
    Boolean(deps)
  );
  return state;
}

export function useControlValue<A>(control: Control<A>) {
  return useControlState(control, (n) => n.value, ControlChange.Value);
}

export function useControlStateVersion(
  control: Control<any>,
  mask?: ControlChange
) {
  return useControlState(control, (c) => c.stateVersion, mask);
}

export function useControlComponent<V>(
  control: Control<V>
): FC<{ children: (formState: V) => ReactElement }> {
  return useControlStateComponent(control, (c) => c.value, ControlChange.Value);
}

export function useControlStateComponent<V, S>(
  control: Control<V>,
  toState: (state: Control<V>) => S,
  mask?: ControlChange
): FC<{ children: (formState: S) => ReactElement }> {
  return useMemo(
    () =>
      ({ children }) => {
        const state = useControlState(control, toState, mask);
        return children(state);
      },
    []
  );
}

export interface FormValidAndDirtyProps {
  state: Control<any>;
  children: (validForm: boolean) => ReactElement;
}

export function FormValidAndDirty({ state, children }: FormValidAndDirtyProps) {
  const validForm = useControlState(
    state,
    (c) => c.valid && c.dirty,
    ControlChange.Valid | ControlChange.Dirty
  );
  return children(validForm);
}

export interface FormArrayProps<V> {
  state: Control<V[] | undefined>;
  children: (elems: Control<V>[]) => ReactNode;
}

export function FormArray<V>({ state, children }: FormArrayProps<V>) {
  const elems = useControlState(
    state,
    (c) => (c.isNonNull() ? getElems(c) : undefined),
    ControlChange.Structure
  );
  return <>{elems ? children(elems) : undefined}</>;
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
  validCheckValue: (control: Control<V>) => any = (c) => control.value
) {
  const handler = useRef<number>();
  const abortController = useRef<AbortController>();
  useControlChangeEffect(
    control,
    (n) => {
      if (handler.current) {
        window.clearTimeout(handler.current);
      }
      if (abortController.current) {
        abortController.current.abort();
      }
      let currentVersion = validCheckValue(n);
      handler.current = window.setTimeout(() => {
        const aborter = new AbortController();
        abortController.current = aborter;
        validator(n, aborter.signal)
          .then((error) => {
            if (validCheckValue(n) === currentVersion) {
              n.setTouched(true);
              n.setError(error);
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
    },
    ControlChange.Value | ControlChange.Validate
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
  return {
    ref: (elem) => {
      state.element = elem;
    },
    value: state.value,
    disabled: state.disabled,
    errorText: state.touched && !state.valid ? state.error : undefined,
    onBlur: () => state.setTouched(true),
    onChange: (e) => state.setValue(e.target.value),
  };
}

export function createRenderer<V, P, E extends HTMLElement = HTMLElement>(
  render: (
    props: PropsWithChildren<P & { state: Control<V> }>,
    genProps: FormControlProps<V, E>
  ) => ReactElement,
  mask?: ControlChange
): FC<P & { state: Control<V> }> {
  return (props) => {
    useControlStateVersion(props.state, mask);
    return render(props, genericProps(props.state));
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

export function useFields<V extends { [k: string]: any } | undefined | null>(
  c: Control<V>
) {
  return useControlState(
    c,
    (c) => (c.isNonNull() ? getFields(c) : undefined),
    ControlChange.Value
  );
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
      if (!newFields.some((x) => thisKey === key(getFields(x).value.value))) {
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
    const selectedElems = getElems(selectable)
      .filter((x) => getFields(x).selected.value)
      .map((x) => getFields(x).value);
    updatedWithRef.current = selectedElems;
    updateElems(control, () => selectedElems);
  }, [selectable, updatedWithRef, control]);
  useControlChangeEffect(
    control,
    (c) => {
      const allControlElems = getElems(c);
      if (updatedWithRef.current === allControlElems) return;
      const selectableElems = groupSyncer(
        allControlElems,
        control.initialValue,
        {
          makeElem: (v, iv) => newElement(c, v).setInitialValue(iv),
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
    ControlChange.Value | ControlChange.InitialValue,
    undefined,
    true
  );
  return selectable;
}

export function useMappedControl<V2, V>(
  control: Control<V2>,
  mapFn: (v: Control<V2>) => V,
  mask?: ControlChange,
  controlSetup?: ControlSetup<V, any>
): Control<V> {
  const mappedControl = useControl(() => mapFn(control), controlSetup);
  useControlChangeEffect(
    control,
    (c) => mappedControl.setValue(mapFn(c)),
    mask
  );
  return mappedControl;
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

type ControlMapped<V, V2> =
  | [Control<V>, (v: Control<V>) => V2, ControlChange | undefined];

type ControlMapValue<C> = C extends Control<infer V>
  ? V
  : C extends ControlMapped<infer V, infer V2>
  ? V2
  : never;

type ChildListeners = [Control<any>, ChangeListenerFunc<Control<any>>][];

export function mappedWith<V, V2>(
  c: Control<V>,
  mapFn: (c: Control<V>) => V2,
  controlChange?: ControlChange
): ControlMapped<V, V2> {
  return [c, mapFn, controlChange];
}

export function useMappedControls<
  C extends { [k: string]: Control<any> | ControlMapped<any, any> },
  V
>(
  controlMapping: C,
  mapFn: (v: { [K in keyof C]: ControlMapValue<C[K]> }) => V
): Control<V>;

export function useMappedControls<
  C extends { [k: string]: Control<any> | ControlMapped<any, any> }
>(controlMapping: C): Control<{ [K in keyof C]: ControlMapValue<C[K]> }>;

export function useMappedControls<
  C extends { [k: string]: Control<any> | ControlMapped<any, any> }
>(
  controlMapping: C,
  mapFn: (v: { [K: string]: any }) => any = (v) => ({ ...v })
): Control<any> {
  const [valueField] = useState(() =>
    Object.fromEntries(
      Object.entries(controlMapping).map(([f, cm]) => {
        const [c, mapFn] = controlAndMapFn(cm);
        return [f, mapFn(c)];
      })
    )
  );
  const mappedControl = useControl<any>(() => mapFn(valueField));
  const cbAddedRef = useRef(false);
  Object.entries(controlMapping).forEach(([f, cm]) => {
    const [control, mapFn, change] = controlAndMapFn(cm);
    useControlChangeEffect(
      control,
      (c) => {
        valueField[f] = mapFn(c);
        if (!cbAddedRef.current) {
          cbAddedRef.current = true;
          addAfterChangesCallback(runMapper);
        }
      },
      change
    );
  });
  return mappedControl;

  function runMapper() {
    cbAddedRef.current = false;
    mappedControl.value = mapFn(valueField);
  }

  function controlAndMapFn(
    c: Control<any> | ControlMapped<any, any>
  ): ControlMapped<any, any> {
    return Array.isArray(c) ? c : [c, (c) => c.value, ControlChange.Value];
  }
}

export function usePreviousValue<V>(
  control: Control<V>
): Control<{ previous?: V; current: V }> {
  const withPrev = useControl<{ previous?: V; current: V }>(() => ({
    current: control.value,
  }));
  useControlChangeEffect(
    control,
    (c) =>
      (withPrev.value = { previous: withPrev.value.current, current: c.value }),
    ControlChange.Value
  );
  return withPrev;
}

export function useFlattenedControl<V>(
  control: Control<Control<V>>
): Control<V> {
  const prevRef = useRef<[Control<V>, () => void]>();
  const flattened = useControl(() => control.value.value);
  useControlChangeEffect(
    control,
    (c) => {
      const newControl = c.value;
      if (prevRef.current) {
        if (prevRef.current[0] === newControl) {
          return;
        }
        prevRef.current[1]();
      }
      const updateFlattened = () => {
        flattened.value = newControl.value;
      };
      updateFlattened();
      newControl.addChangeListener(updateFlattened, ControlChange.Value);
      prevRef.current = [
        newControl,
        () => newControl.removeChangeListener(updateFlattened),
      ];
    },
    ControlChange.Value,
    undefined,
    true
  );
  return flattened;
}
