import React, {
  ReactElement,
  FC,
  useRef,
  useMemo,
  useState,
  useEffect,
  ReactNode,
  ChangeEvent,
  PropsWithChildren,
} from "react";
import { BaseControl, ControlChange, FormControl, ArrayControl } from "./nodes";

export function useControlChangeEffect<Control extends BaseControl>(
  control: Control,
  changeEffect: (control: Control, change: ControlChange) => void,
  mask?: ControlChange,
  deps?: any[]
) {
  const updater = useMemo(() => changeEffect, deps ?? [control]);
  useEffect(() => {
    control.addChangeListener(updater, mask);
    return () => control.removeChangeListener(updater);
  }, [updater]);
}

export function useControlState<N extends BaseControl, S>(
  control: N,
  toState: (state: N) => S,
  mask?: ControlChange
): S {
  const [state, setState] = useState(() => toState(control));
  useEffect(() => {
    setState(toState(control));
  }, [control]);
  useControlChangeEffect(
    control,
    (control) => setState(toState(control)),
    mask
  );
  return state;
}

export function useControlValue<A>(
  control: FormControl<A>,
  mask?: ControlChange
) {
  return useControlState(control, (n) => n.value, mask);
}

export function useControlStateVersion(
  control: BaseControl,
  mask?: ControlChange
) {
  return useControlState(control, (c) => c.stateVersion, mask);
}

export function useControlStateComponent<S, C extends BaseControl>(
  control: C,
  toState: (state: C) => S,
  mask?: ControlChange
): FC<{ children: (formState: S) => ReactElement }> {
  return useMemo(
    () => ({ children }) => {
      const state = useControlState(control, toState, mask);
      return children(state);
    },
    []
  );
}

export interface FormValidAndDirtyProps {
  state: BaseControl;
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

export interface FormArrayProps<C extends BaseControl> {
  state: ArrayControl<C>;
  children: (elems: C[]) => ReactNode;
}

export function FormArray<C extends BaseControl>({
  state,
  children,
}: FormArrayProps<C>) {
  useControlState(state, (c) => c.elems, ControlChange.Value);
  return <>{children(state.elems)}</>;
}

function defaultValidCheck(n: BaseControl) {
  return n instanceof FormControl ? n.value : n.stateVersion;
}

export function useAsyncValidator<C extends BaseControl>(
  control: C,
  validator: (
    control: C,
    abortSignal: AbortSignal
  ) => Promise<string | null | undefined>,
  delay: number,
  validCheckValue?: (control: C) => any
) {
  const handler = useRef<number>();
  const abortController = useRef<AbortController>();
  const validCheck = validCheckValue ?? defaultValidCheck;
  useControlChangeEffect(
    control,
    (n) => {
      if (handler.current) {
        window.clearTimeout(handler.current);
      }
      if (abortController.current) {
        abortController.current.abort();
      }
      let currentVersion = validCheck(n);
      handler.current = window.setTimeout(() => {
        const aborter = new AbortController();
        abortController.current = aborter;
        validator(n, aborter.signal)
          .then((error) => {
            if (validCheck(n) === currentVersion) {
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

// Only allow strings and numbers
export type FinputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  state: FormControl<string | number>;
};

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

export function Finput({ state, ...others }: FinputProps) {
  // Re-render on value or disabled state change
  useControlStateVersion(state, ControlChange.Value | ControlChange.Disabled);

  // Update the HTML5 custom validity whenever the error message is changed/cleared
  useControlChangeEffect(
    state,
    (s) =>
      (state.element as HTMLInputElement)?.setCustomValidity(state.error ?? ""),
    ControlChange.Error
  );
  const theseProps = genericProps(state);
  return (
    <input
      {...theseProps}
      ref={(r) => {
        state.element = r;
        if (r) r.setCustomValidity(state.error ?? "");
      }}
      {...others}
    />
  );
}

// Only allow strings and numbers
export type FselectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  state: FormControl<string | number>;
};

export function Fselect({ state, children, ...others }: FselectProps) {
  // Re-render on value or disabled state change
  useControlStateVersion(state, ControlChange.Value | ControlChange.Disabled);

  // Update the HTML5 custom validity whenever the error message is changed/cleared
  useControlChangeEffect(
    state,
    (s) =>
      (s.element as HTMLSelectElement)?.setCustomValidity(state.error ?? ""),
    ControlChange.Error
  );
  const theseProps = genericProps(state);
  return (
    <select
      {...theseProps}
      ref={(r) => {
        state.element = r;
        if (r) r.setCustomValidity(state.error ?? "");
      }}
      {...others}
    >
      {children}
    </select>
  );
}
