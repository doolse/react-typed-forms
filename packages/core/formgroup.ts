import { useState, ReactElement, useRef, useMemo, useEffect } from "react";
import { FormControlProps, FormControlState } from "./formcontrol";

export type ChildErrors<T, E = string> = {
  [P in keyof T]?: E;
};

export type FormGroupState<T, E = string> = FormControlState<T, E> & {
  children: { [P in keyof T & string]?: FormControlState<T[P], E> };
  initialValue: T;
};

export type ControlDef<T, V, E> = {
  validator?: (c: V, ctx: T) => E | undefined;
};

export type ControlDefs<T, O, E = string> = {
  [P in keyof T]: ControlDef<T, T[P], E> & O;
};

type FieldsWithType<T, V> = {
  [K in keyof T]: T[K] extends V ? K & string : never;
}[keyof T];

export type FormControlData<V, O, E> = {
  name: string;
  initialState: FormControlState<V, E>;
  controlData: O;
  onChange(v: V): FormControlState<V, E>;
  onInvalid(): FormControlState<V, E>;
  onBlur(): FormControlState<V, E>;
};

export type FieldLookup<T, O, E> = <K extends keyof T & string>(
  name: K
) => FormControlData<T[K], O, E>;

export type FieldPropsRenderer<O, E, V, P> = (
  controlProps: FormControlProps<V, O, E>
) => P;

export type FieldRenderer<O, E, V, P> = (
  controlProps: FormControlProps<V, O, E>
) => (p: P) => ReactElement;

export type FieldRendererComponent<K extends string, P> = (
  props: P & { field: K }
) => ReactElement;

type NonOptionalKeys<T> = {
  [k in keyof T]-?: undefined extends T[k] ? never : k;
}[keyof T];

export type FormGroupProps<T, O, E, DV, DP> = {
  field: FieldLookup<T, O, E>;
  state: {
    readonly current: FormGroupState<T, E>;
  };
  FormField: FieldRendererComponent<FieldsWithType<T, DV>, DP>;
  useFieldRenderer: <V, P>(
    renderer: FieldRenderer<O, E, V, P>
  ) => FieldRendererComponent<FieldsWithType<T, V>, P>;
  updateState(
    change: Partial<FormControlState<T, E>>,
    errors?: ChildErrors<T, E>
  ): void;
};

export function useFormGroup<T, DV, DP, O = {}, E = string>(
  definitions: ControlDefs<T, O, E>,
  initialValue: T,
  renderer: FieldRenderer<O, E, DV, DP>,
  onStateChange?: (state: FormGroupState<T, E>) => void
): FormGroupProps<T, O, E, DV, DP> {
  const initialState = useMemo<FormGroupState<T, E>>(() => {
    const children: {
      [P in keyof T & string]?: FormControlState<T[P], E>;
    } = {};
    var allValid = true;
    for (const name in definitions) {
      const value = initialValue[name];
      const error = definitions[name].validator?.(value, initialValue);
      const valid = !Boolean(error);
      children[name] = {
        value,
        touched: false,
        dirty: false,
        valid,
        error,
      };
      allValid = allValid && valid;
    }
    return {
      touched: false,
      dirty: false,
      valid: allValid,
      value: initialValue,
      children,
      initialValue,
    };
  }, []);
  const state = useRef(initialState);
  const [, setReRender] = useState({});

  function getChildState<K extends keyof T & string>(
    name: K,
    error?: E
  ): FormControlState<T[K], E> {
    const curState = state.current;
    var curChild = curState.children[name] as FormControlState<T[K], E>;
    if (!curChild) {
      const value = curState.value[name];
      error = error ?? definitions[name].validator?.(value, curState.value);
      curChild = {
        value,
        error,
        dirty: curState.dirty,
        touched: curState.touched,
        valid: !Boolean(error),
      };
      curState.children[name] = curChild;
    }
    return curChild;
  }

  function updateChild<K extends keyof T & string>(
    name: K,
    childState: FormControlState<T[K], E>
  ): FormControlState<T[K], E> {
    const cur = { ...state.current };
    cur.children = { ...cur.children, [name]: childState };
    cur.value = { ...cur.value, [name]: childState.value };
    if (!cur.dirty && childState.dirty) {
      cur.dirty = true;
    }
    if (!cur.touched && childState.touched) {
      cur.touched = true;
    }
    if (cur.valid !== childState.valid) {
      cur.valid = !childState.valid
        ? false
        : Object.values(
            cur.children as { [k: string]: { valid: boolean } }
          ).every((v) => v.valid);
    }
    state.current = cur;
    onStateChange?.(cur);
    return childState;
  }

  const fieldLookup: FieldLookup<T, O, E> = (name) => {
    const { validator, ...controlData } = definitions[name];
    return {
      name,
      initialState: getChildState(name),
      controlData: controlData as O,
      onBlur() {
        const st = getChildState(name);
        if (!st.touched) {
          return updateChild(name, { ...st, touched: true });
        }
        return st;
      },
      onChange(v) {
        const st = getChildState(name);
        if (st.value !== v) {
          const error = validator?.(v, state.current.value);
          return updateChild(name, {
            ...st,
            value: v,
            dirty: true,
            error,
            valid: !error,
          });
        }
        return st;
      },
      onInvalid() {
        const st = getChildState(name);
        if (st.valid) {
          return updateChild(name, { ...st, valid: false });
        }
        return st;
      },
    };
  };

  function useFieldRenderer<V, P>(
    render: FieldRenderer<O, E, V, P>
  ): FieldRendererComponent<FieldsWithType<T, V>, P> {
    return useMemo<FieldRendererComponent<FieldsWithType<T, V>, P>>(
      () => ({ field, ...otherProps }) => {
        const {
          initialState,
          onBlur,
          onChange,
          name,
          controlData,
          onInvalid,
        } = (fieldLookup(field) as unknown) as FormControlData<V, O, E>;
        const [state, setState] = useState(initialState);
        useEffect(() => {
          if (state !== initialState) {
            setState(initialState);
          }
        }, [initialState]);
        return render({
          name,
          state,
          controlData,
          onChange: (v: V) => setState(onChange(v)),
          onBlur: () => setState(onBlur()),
          onInvalid: () => setState(onInvalid()),
        })(otherProps as any);
      },
      []
    );
  }
  return {
    field: fieldLookup,
    state,
    FormField: useFieldRenderer(renderer),
    useFieldRenderer,
    updateState(change, errors) {
      state.current = { ...state.current, ...change, children: {} };
      var valid = true;
      for (const name in definitions) {
        const cs = getChildState(name, errors && errors[name]);
        valid = valid && cs.valid;
      }
      state.current.valid = valid;
      setReRender({});
    },
  };
}

export function mkFieldRenderer<O, E, P, P2, V>(
  propsRender: FieldPropsRenderer<O, E, V, P>,
  toElement: (props: P2) => ReactElement
): FieldRenderer<O, E, V, Omit<P2, NonOptionalKeys<P & P2>>> {
  return (cp) => (op) => toElement({ ...propsRender(cp), ...op } as any);
}
