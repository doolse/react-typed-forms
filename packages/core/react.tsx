import React, { ReactElement, FC, useRef } from "react";
import { useMemo, useState, useEffect, ReactNode } from "react";
import {
  BaseControl,
  NodeChange,
  FormControl,
  ArrayControl,
  ToOptional,
  GroupControl,
  GroupControls,
  GroupValues,
  GroupDef,
} from "./nodes";

export function useFormListener<V extends BaseControl, S>(
  control: V,
  toState: (state: V) => S,
  mask?: NodeChange
): S {
  const [state, setState] = useState(toState(control));
  useChangeListener(control, () => setState(toState(control)), mask);
  return state;
}

export function useFormState<FIELDS extends object>(
  group: GroupDef<FIELDS>,
  value: ToOptional<GroupValues<FIELDS>>
): GroupControl<GroupControls<FIELDS>> {
  return useMemo(() => {
    return group.createGroup(value);
  }, [group]);
}

export function useFormListenerComponent<S, V extends BaseControl>(
  control: V,
  toState: (state: V) => S,
  mask?: NodeChange
): FC<{ children: (formState: S) => ReactElement }> {
  return useMemo(
    () => ({ children }) => {
      const state = useFormListener(control, toState, mask);
      return children(state);
    },
    []
  );
}

export function useValidChangeComponent(
  control: BaseControl
): FC<{ children: (formState: boolean) => ReactElement }> {
  return useFormListenerComponent(
    control,
    (c) => c.valid && c.dirty,
    NodeChange.Valid | NodeChange.Dirty
  );
}

export function FormArray<V extends BaseControl>({
  state,
  children,
}: {
  state: ArrayControl<V>;
  children: (elems: V[]) => ReactNode;
}) {
  useFormListener(state, (c) => c.elems.length, NodeChange.Value);
  return <>{children(state.elems)}</>;
}

export function useChangeListener<Node extends BaseControl>(
  control: Node,
  listener: (node: Node, change: NodeChange) => void,
  mask?: NodeChange,
  deps?: any[]
) {
  const updater = useMemo(() => listener, deps ?? []);
  useEffect(() => {
    control.addChangeListener(updater, mask);
    return () => control.removeChangeListener(updater);
  }, [updater]);
}

export function Finput({
  state,
  ...others
}: React.InputHTMLAttributes<HTMLInputElement> & {
  state: FormControl<string | number>;
}) {
  useFormStateVersion(state);
  const [domRef, setDomRef] = useState<HTMLInputElement>();
  function updateError(elem: HTMLInputElement) {
    const isShowError = state.touched && !state.valid && Boolean(state.error);
    elem.setCustomValidity(isShowError ? state.error! : "");
    elem.reportValidity();
  }
  useEffect(() => {
    if (domRef) {
      updateError(domRef);
    }
  }, [domRef, state.error, state.touched, state.valid]);
  return (
    <input
      ref={(d) => setDomRef(d!)}
      value={state.value}
      disabled={state.disabled}
      onChange={(e) => state.setValue(e.currentTarget.value)}
      onBlur={() => state.setTouched(true)}
      {...others}
    />
  );
}

export function useFormStateVersion(control: BaseControl, mask?: NodeChange) {
  return useFormListener(control, (c) => c.stateVersion, mask);
}
