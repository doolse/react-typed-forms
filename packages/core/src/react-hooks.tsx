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
  ControlChange,
  createControl,
  FormControl,
  FormControlBuilder,
  FormControlFields,
} from "./nodes";

export function useControlChangeEffect<V, M>(
  control: FormControl<V, M>,
  changeEffect: (control: FormControl<V, M>, change: ControlChange) => void,
  mask?: ControlChange,
  deps?: any[],
  runInitial?: boolean
) {
  const effectRef = useRef(changeEffect);
  effectRef.current = changeEffect;
  useEffect(() => {
    if (runInitial) effectRef.current(control, 0);
    const changeListener = (c: FormControl<V, M>, m: ControlChange) => {
      effectRef.current(c, m);
    };
    control.addChangeListener(changeListener, mask);
    return () => control.removeChangeListener(changeListener);
  }, deps ?? [control, mask]);
}

export function useValueChangeEffect<V, M>(
  control: FormControl<V, M>,
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
    const updater = (c: FormControl<V, M>) => {
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
  control: FormControl<V, M>,
  toState: (state: FormControl<V, M>, previous?: S) => S,
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

export function useControlValue<A>(control: FormControl<A>) {
  return useControlState(control, (n) => n.value, ControlChange.Value);
}

export function useControlStateVersion<V>(
  control: FormControl<V>,
  mask?: ControlChange
) {
  return useControlState(control, (c) => c.stateVersion, mask);
}

export function useControlStateComponent<V, M, S>(
  control: FormControl<V, M>,
  toState: (state: FormControl<V, M>) => S,
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
  state: FormControl<any>;
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
  state: FormControl<V[] | undefined, M>;
  children: (elems: FormControl<V, M>[]) => ReactNode;
}

export function FormArray<V, M = BaseControlMetadata>({
  state,
  children,
}: FormArrayProps<V, M>) {
  const elems = useControlState(state, (c) => c.elems, ControlChange.Value);
  return <>{elems ? children(elems) : undefined}</>;
}

export function useAsyncValidator<V, M>(
  control: FormControl<V, M>,
  validator: (
    control: FormControl<V, M>,
    abortSignal: AbortSignal
  ) => Promise<string | null | undefined>,
  delay: number,
  validCheckValue: (control: FormControl<V, M>) => any = (c) => control.value
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
  state: FormControl<V>
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
    props: PropsWithChildren<P & { state: FormControl<V> }>,
    genProps: FormControlProps<V, E>
  ) => ReactElement,
  mask?: ControlChange
): FC<P & { state: FormControl<V> }> {
  return (props) => {
    useControlStateVersion(props.state, mask);
    return render(props, genericProps(props.state));
  };
}

export function useControl<V, M = BaseControlMetadata>(
  v: V,
  builder?: FormControlBuilder<V, Partial<M>>
): FormControl<V, Partial<M>> {
  return useState(() =>
    builder ? builder.build(v, v) : createControl<V, Partial<M>>(v)
  )[0];
}

export function useOptionalFields<V, M>(
  c: FormControl<V | undefined, M>
): FormControlFields<NonNullable<V>, M> | undefined {
  return useControlState(c, (c) => c.fields, ControlChange.Value);
}
