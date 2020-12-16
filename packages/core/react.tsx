import React, { ReactElement, FC, useRef, useCallback } from "react";
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
  value: ToOptional<GroupValues<FIELDS>>,
  dontValidate?: boolean
): GroupControl<GroupControls<FIELDS>> {
  return useMemo(() => {
    const groupState = group.createGroup(value);
    if (!dontValidate) {
      groupState.validate();
    }
    return groupState;
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

export function useFormStateVersion(control: BaseControl, mask?: NodeChange) {
  return useFormListener(control, (c) => c.stateVersion, mask);
}

export function useAsyncValidator<C extends BaseControl>(
  node: C,
  validator: (node: C, abortSignal: AbortSignal) => Promise<string | undefined>,
  delay: number
) {
  const handler = useRef<number>();
  const abortController = useRef<AbortController>();
  useChangeListener(
    node,
    (n) => {
      if (handler.current) {
        window.clearTimeout(handler.current);
      }
      if (abortController.current) {
        abortController.current.abort();
      }
      let currentVersion = n.stateVersion;
      handler.current = window.setTimeout(() => {
        const aborter = new AbortController();
        abortController.current = aborter;
        validator(n, aborter.signal)
          .then((error) => {
            if (n.stateVersion === currentVersion) {
              n.setShowValidation(true);
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
    NodeChange.Value | NodeChange.Validate
  );
}

// Only allow strings and numbers
export type FinputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  state: FormControl<string | number>;
};

export function Finput({ state, ...others }: FinputProps) {
  // Re-render on value or disabled state change
  useFormStateVersion(state, NodeChange.Value | NodeChange.Disabled);

  // We need the DOM element for setting validation errors
  const domRef = useRef<HTMLInputElement | null>(null);

  // Update the HTML5 custom validity whenever the error message is changed/cleared
  useChangeListener(
    state,
    () => domRef.current?.setCustomValidity(state.error ?? ""),
    NodeChange.Error
  );
  return (
    <input
      ref={(r) => {
        domRef.current = r;
        if (r) r.setCustomValidity(state.error ?? "");
      }}
      value={state.value}
      disabled={state.disabled}
      onChange={(e) => state.setValue(e.currentTarget.value)}
      onBlur={() => state.setShowValidation(true)}
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
  useFormStateVersion(state, NodeChange.Value | NodeChange.Disabled);

  // We need the DOM element for setting validation errors
  const domRef = useRef<HTMLSelectElement | null>(null);

  // Update the HTML5 custom validity whenever the error message is changed/cleared
  useChangeListener(
    state,
    () => domRef.current?.setCustomValidity(state.error ?? ""),
    NodeChange.Error
  );
  return (
    <select
      ref={(r) => {
        domRef.current = r;
        if (r) r.setCustomValidity(state.error ?? "");
      }}
      value={state.value}
      disabled={state.disabled}
      onChange={(e) => state.setValue(e.currentTarget.value)}
      onBlur={() => state.setShowValidation(true)}
      {...others}
    >
      {children}
    </select>
  );
}
