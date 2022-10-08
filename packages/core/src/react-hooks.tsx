import React, {
  ChangeEvent,
  FC,
  PropsWithChildren,
  ReactElement,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  BaseControlMetadata,
  Control,
  ControlChange,
  controlGroup,
  ControlSetup,
  FormControlFields,
  newControl,
  RetainOptionality,
} from "./nodes";

export function useControlChangeEffect<V, M>(
  control: Control<V, M>,
  changeEffect: (control: Control<V, M>, change: ControlChange) => void,
  mask?: ControlChange,
  deps?: any[],
  runInitial?: boolean
) {
  const effectRef = useRef(changeEffect);
  effectRef.current = changeEffect;
  useEffect(() => {
    if (runInitial) effectRef.current(control, 0);
    const changeListener = (c: Control<V, M>, m: ControlChange) => {
      effectRef.current(c, m);
    };
    control.addChangeListener(changeListener, mask);
    return () => control.removeChangeListener(changeListener);
  }, deps ?? [control, mask]);
}

export function useValueChangeEffect<V, M>(
  control: Control<V, M>,
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
    const updater = (c: Control<V, M>) => {
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

export function useControlState<V, M, S>(
  control: Control<V, M>,
  toState: (state: Control<V, M>, previous?: S) => S,
  mask?: ControlChange,
  deps?: any[]
): S {
  const [state, setState] = useState(() => toState(control));
  useControlChangeEffect(
    control,
    (control) => setState((p) => toState(control, p)),
    mask,
    deps,
    true
  );
  return state;
}

export function useControlValue<A>(control: Control<A>) {
  return useControlState(control, (n) => n.value, ControlChange.Value);
}

export function useControlStateVersion<V>(
  control: Control<V>,
  mask?: ControlChange
) {
  return useControlState(control, (c) => c.stateVersion, mask);
}

export function useControlStateComponent<V, M, S>(
  control: Control<V, M>,
  toState: (state: Control<V, M>) => S,
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

export interface FormArrayProps<V, M> {
  state: Control<V[] | undefined, M>;
  children: (elems: Control<V, M>[]) => ReactNode;
}

export function FormArray<V, M = BaseControlMetadata>({
  state,
  children,
}: FormArrayProps<V, M>) {
  const elems = useControlState(state, (c) => c.elems, ControlChange.Value);
  return <>{elems ? children(elems) : undefined}</>;
}

export function useAsyncValidator<V, M>(
  control: Control<V, M>,
  validator: (
    control: Control<V, M>,
    abortSignal: AbortSignal
  ) => Promise<string | null | undefined>,
  delay: number,
  validCheckValue: (control: Control<V, M>) => any = (c) => control.value
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
  configure?: ControlSetup<V, M>
): Control<V, M>;

export function useControl<V = undefined, M = BaseControlMetadata>(): Control<
  V | undefined,
  M
>;

export function useControl(
  v?: any,
  configure?: ControlSetup<any, any>
): Control<any, any> {
  return useState(() => {
    const rv = typeof v === "function" ? v() : v;
    return newControl(rv, rv, configure);
  })[0];
}

export function useOptionalFields<V, M>(
  c: Control<V, M>
): FormControlFields<NonNullable<V>, M> | RetainOptionality<V> {
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
  useControlChangeEffect(
    control,
    (c) => {
      const allControlElems = c.elems;
      if (updatedWithRef.current === allControlElems) return;
      selectable.update((existing) => {
        return groupSyncer(allControlElems, control.initialValue, {
          makeElem: (v, iv) => c.newElement(v, iv),
          makeGroup: (selected, wasSelected, value) =>
            controlGroup({
              selected: newControl(selected, wasSelected),
              value,
            }) as Control<SelectionGroup<V>, M>,
        });
      });
    },
    ControlChange.Value | ControlChange.InitialValue,
    undefined,
    true
  );
  useControlChangeEffect(
    selectable,
    (c) => {
      const selectedElems = selectable.elems
        .filter((x) => x.fields.selected.value)
        .map((x) => x.fields.value);
      updatedWithRef.current = selectedElems;
      control.update((ex) => selectedElems);
    },
    ControlChange.Value
  );
  return selectable;
}
