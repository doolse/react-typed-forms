import React, {
  ChangeEvent,
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
  BaseControlMetadata,
  ChangeListener,
  ChangeListenerFunc,
  Control,
  ControlChange,
  controlGroup,
  ControlSetup,
  ControlValue,
  FormControlFields,
  newControl,
  ReadableControl,
} from "./nodes";

export function useControlChangeEffect<C extends ReadableControl<any>>(
  control: C,
  changeEffect: (control: C, change: ControlChange) => void,
  mask?: ControlChange,
  deps?: any[],
  runInitial?: boolean
) {
  const effectRef = useRef<[(control: C, change: ControlChange) => void, C]>([
    changeEffect,
    control,
  ]);
  effectRef.current[0] = changeEffect;
  useEffect(() => {
    if (runInitial || control !== effectRef.current[1])
      effectRef.current[0](control, 0);
    effectRef.current[1] = control;
    const changeListener = (c: C, m: ControlChange) => {
      effectRef.current[0](c, m);
    };
    control.addChangeListener(changeListener, mask);
    return () => control.removeChangeListener(changeListener);
  }, deps ?? [control, mask]);
}

export function useValueChangeEffect<V>(
  control: ReadableControl<V>,
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
    const updater = (c: ReadableControl<V>) => {
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

export function useControlState<C extends ReadableControl<any>, S>(
  control: C,
  toState: (state: C, previous?: S) => S,
  mask?: ControlChange,
  deps?: any[]
): S {
  const [state, setState] = useState(() => toState(control));
  useControlChangeEffect(
    control,
    (control) => setState((p) => toState(control, p)),
    mask,
    deps
  );
  return state;
}

export function useControlValue<A>(control: ReadableControl<A>) {
  return useControlState(control, (n) => n.value, ControlChange.Value);
}

export function useControlStateVersion(
  control: ReadableControl<any>,
  mask?: ControlChange
) {
  return useControlState(control, (c) => c.stateVersion, mask);
}

export function useControlStateComponent<C extends ReadableControl<any>, S>(
  control: C,
  toState: (state: C) => S,
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
  state: ReadableControl<any>;
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

export interface FormArrayProps<V, M> {
  state: Control<V[] | undefined, M>;
  children: (elems: Control<V, M>[]) => ReactNode;
}

export function FormArray<V, M = BaseControlMetadata>({
  state,
  children,
}: FormArrayProps<V, M>) {
  const elems = useControlState(state, (c) => c.elems, ControlChange.Structure);
  return <>{elems ? children(elems) : undefined}</>;
}

export function renderAll<V, M>(
  render: (c: Control<V, M>, index: number) => ReactNode
): (elems: Control<V, M>[]) => ReactNode {
  return (e) => e.map(render);
}

export function useAsyncValidator<C extends ReadableControl<any>>(
  control: C,
  validator: (
    control: C,
    abortSignal: AbortSignal
  ) => Promise<string | null | undefined>,
  delay: number,
  validCheckValue: (control: C) => any = (c) => control.value
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

export function useControl<V, M = BaseControlMetadata>(
  initialState: V | (() => V),
  configure?: ControlSetup<V, M>,
  afterInit?: (c: Control<V, M>) => void
): Control<V, M>;

export function useControl<V = undefined, M = BaseControlMetadata>(): Control<
  V | undefined,
  M
>;

export function useControl(
  v?: any,
  configure?: ControlSetup<any, any>,
  afterInit?: (c: Control<any, any>) => void
): Control<any, any> {
  return useState(() => {
    const rv = typeof v === "function" ? v() : v;
    const c = newControl(rv, rv, configure);
    return afterInit?.(c) ?? c;
  })[0];
}

export function useOptionalFields<V, M>(
  c: Control<V, M>
): FormControlFields<V, M> {
  return useControlState(c, (c) => c.fields, ControlChange.Value);
}

export interface SelectionGroup<V> {
  selected: boolean;
  value: V;
}

interface SelectionGroupCreator<V, M> {
  makeElem: (v: V, iv: V) => Control<V, M>;
  makeGroup: (
    selected: boolean,
    wasSelected: boolean,
    value: Control<V, M>
  ) => Control<SelectionGroup<V>, M>;
}

type SelectionGroupSync<V, M> = (
  elems: Control<V, M>[],
  initialValue: V[],
  groupCreator: SelectionGroupCreator<V, M>
) => Control<SelectionGroup<V>, M>[];

const defaultSelectionCreator: SelectionGroupSync<any, any> = (
  elems,
  initialValue,
  creator
) => {
  return elems.map((x, i) => {
    return creator.makeGroup(true, true, x);
  });
};

export function ensureSelectableValues<V, M>(
  values: V[],
  key: (v: V) => any,
  parentSync: SelectionGroupSync<
    V,
    M
  > = defaultSelectionCreator as unknown as SelectionGroupSync<V, M>
): SelectionGroupSync<V, M> {
  return (elems, initialValue, groupCreator) => {
    const newFields = parentSync(elems, initialValue, groupCreator);
    values.forEach((av) => {
      const thisKey = key(av);
      if (!newFields.some((x) => thisKey === key(x.fields.value.value))) {
        newFields.push(
          groupCreator.makeGroup(false, false, groupCreator.makeElem(av, av))
        );
      }
    });
    return newFields;
  };
}

export function useSelectableArray<V, M>(
  control: Control<V[], M>,
  groupSyncer: SelectionGroupSync<
    V,
    M
  > = defaultSelectionCreator as unknown as SelectionGroupSync<V, M>
): Control<SelectionGroup<V>[], M> {
  const selectable = useControl<SelectionGroup<V>[], M>([]);
  const updatedWithRef = useRef<Control<V, M>[] | undefined>(undefined);
  const selectChangeListener = useCallback(() => {
    const selectedElems = selectable.elems
      .filter((x) => x.fields.selected.value)
      .map((x) => x.fields.value);
    updatedWithRef.current = selectedElems;
    control.update(() => selectedElems);
  }, [selectable, updatedWithRef, control]);
  useControlChangeEffect(
    control,
    (c) => {
      const allControlElems = c.elems;
      if (updatedWithRef.current === allControlElems) return;
      const selectableElems = groupSyncer(
        allControlElems,
        control.initialValue,
        {
          makeElem: (v, iv) => c.newElement(v).setInitialValue(iv),
          makeGroup: (isSelected, wasSelected, value) => {
            const selected = newControl(isSelected, wasSelected);
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
      selectable.update(() => selectableElems);
      updatedWithRef.current = allControlElems;
    },
    ControlChange.Value | ControlChange.InitialValue,
    undefined,
    true
  );
  return selectable;
}

export function useMappedControl<C extends ReadableControl<any, M>, V, M>(
  control: C,
  mapFn: (v: C) => V,
  mask?: ControlChange,
  controlSetup?: ControlSetup<V, M>
): Control<V, M> {
  const changeRef = useRef<ChangeListenerFunc<C>>();
  const c = useControl(
    () => mapFn(control),
    controlSetup,
    (after) => {
      changeRef.current = (c) => {
        after.setValue(mapFn(c));
      };
      control.addChangeListener(changeRef.current, mask);
    }
  );
  useEffect(() => {
    return () => {
      control.removeChangeListener(changeRef.current!);
    };
  }, [changeRef.current]);
  return c;
}

export function useControlGroup<C extends { [k: string]: any }, M>(
  fields: C
): Control<{ [K in keyof C]: ControlValue<C[K]> }, M> {
  return useState(() => controlGroup(fields))[0];
}

type ControlMapped<V, V2, M> =
  | [Control<V, M>, (v: Control<V, M>) => V2, ControlChange | undefined];

type ControlMapValue<C> = C extends Control<infer V, any>
  ? V
  : C extends ControlMapped<infer V, infer V2, any>
  ? V2
  : never;

type ChildListeners = [
  Control<any, any>,
  ChangeListenerFunc<Control<any, any>>
][];

export function mappedWith<V, V2, M>(
  c: Control<V, M>,
  mapFn: (c: Control<V, M>) => V2,
  controlChange?: ControlChange
): ControlMapped<V, V2, M> {
  return [c, mapFn, controlChange];
}

export function useMappedControls<
  C extends { [k: string]: Control<any, any> | ControlMapped<any, any, any> },
  M extends BaseControlMetadata & { listeners?: ChildListeners }
>(
  control: C | (() => C)
): Control<{ [K in keyof C]: ControlMapValue<C[K]> }, M> {
  function valueForMapping(c: Control<any, any> | ControlMapped<any, any, M>) {
    if (Array.isArray(c)) {
      return c[1](c[0]);
    } else {
      return c.value;
    }
  }
  function changesForMapping(
    c: ControlMapped<any, any, M>
  ): ControlChange | undefined {
    return Array.isArray(c) ? c[2] : ControlChange.Value;
  }

  const mappedFields = useRef<C | undefined>(undefined);

  const mappedControl = useControl<any, M>(
    () => {
      mappedFields.current =
        typeof control === "function" ? control() : control;
      return Object.fromEntries(
        Object.entries(mappedFields.current!).map(([f, cm]) => {
          return [f, valueForMapping(cm as any)];
        })
      );
    },
    undefined,
    (c) => {
      c.meta.listeners = Object.entries(mappedFields.current!).map(
        ([f, cm]) => {
          const [childField, mapperFunc] = Array.isArray(cm)
            ? cm
            : [cm, (c: Control<any, any>) => c.value];
          const listener = (child: Control<any, any>) => {
            c.fields![f].setValue(mapperFunc(child));
          };
          childField.addChangeListener(listener, changesForMapping(cm as any));
          return [childField, listener];
        }
      );
    }
  );
  useEffect(() => {
    return () => {
      mappedControl.meta.listeners!.forEach(([c, l]) =>
        c.removeChangeListener(l)
      );
    };
  }, [mappedControl.meta.listeners]);
  return mappedControl;

  // return useControlState(
  //     control,
  //     (c, p?: Control<V, M>) => {
  //       const v = mapFn(c);
  //       if (p) {
  //         return p.setValue(v);
  //       }
  //       return newControl(v, v, controlSetup);
  //     },
  //     mask ?? ControlChange.Value
  // );
}
