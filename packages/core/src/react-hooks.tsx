import React, {
  ReactElement,
  FC,
  useRef,
  useMemo,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  BaseNode,
  NodeChange,
  ValueNode,
  ArrayNode,
  NodeTypeForDefinition,
  control,
  ValueTypeForDefintion,
  AnyNodeDefinition,
} from "./nodes";

export function useNodeChangeEffect<Node extends BaseNode>(
  control: Node,
  listenerEffect: (node: Node, change: NodeChange) => void,
  mask?: NodeChange,
  deps?: any[]
) {
  const updater = useMemo(() => listenerEffect, deps ?? [control]);
  useEffect(() => {
    control.addChangeListener(updater, mask);
    return () => control.removeChangeListener(updater);
  }, [updater]);
}

export function useNodeState<N extends BaseNode, S>(
  node: N,
  toState: (state: N) => S,
  mask?: NodeChange
): S {
  const [state, setState] = useState(() => toState(node));
  useEffect(() => {
    setState(toState(node));
  }, [node]);
  useNodeChangeEffect(node, (node) => setState(toState(node)), mask);
  return state;
}

export function useNodeValue<A>(node: ValueNode<A>, mask?: NodeChange) {
  return useNodeState(node, (n) => n.value, mask);
}

export function useNodeStateVersion(control: BaseNode, mask?: NodeChange) {
  return useNodeState(control, (c) => c.stateVersion, mask);
}

/**
 * Create a group control using the given definition.
 * Please note that once created, it will already return the same instance,
 * e.g. the definition should be constant.
 * @param group The definition of the form group
 * @param value The initial value for the form
 * @param dontValidate Whether to run validation on initial values
 */
export function useNodeForDefinition<DEF extends AnyNodeDefinition>(
  def: DEF,
  value: ValueTypeForDefintion<DEF>,
  dontValidate?: boolean
): NodeTypeForDefinition<DEF> {
  const ref = useRef<any | undefined>();
  if (!ref.current) {
    const cdef = def as any;
    const node = cdef.createNode
      ? cdef.createNode(value)
      : cdef.createArray
      ? cdef.createArray(value)
      : cdef.createGroup(value);
    if (!dontValidate) {
      node.validate();
    }
    ref.current = node;
  }
  return ref.current!;
}

export function useNodeForValue<A>(value: A) {
  return useNodeForDefinition(control<A>(), value);
}

export function useNodeStateComponent<S, C extends BaseNode>(
  control: C,
  toState: (state: C) => S,
  mask?: NodeChange
): FC<{ children: (formState: S) => ReactElement }> {
  return useMemo(
    () => ({ children }) => {
      const state = useNodeState(control, toState, mask);
      return children(state);
    },
    []
  );
}

export interface FormValidAndDirtyProps {
  state: BaseNode;
  children: (validForm: boolean) => ReactElement;
}

export function FormValidAndDirty({ state, children }: FormValidAndDirtyProps) {
  const validForm = useNodeState(
    state,
    (c) => c.valid && c.dirty,
    NodeChange.Valid | NodeChange.Dirty
  );
  return children(validForm);
}

export interface FormArrayProps<C extends BaseNode> {
  state: ArrayNode<C>;
  children: (elems: C[]) => ReactNode;
}

export function FormArray<C extends BaseNode>({
  state,
  children,
}: FormArrayProps<C>) {
  useNodeState(state, (c) => c.elems, NodeChange.Value);
  return <>{children(state.elems)}</>;
}

function defaultValidCheck(n: BaseNode) {
  return n instanceof ValueNode ? n.value : n.stateVersion;
}

export function useAsyncValidator<C extends BaseNode>(
  node: C,
  validator: (
    node: C,
    abortSignal: AbortSignal
  ) => Promise<string | null | undefined>,
  delay: number,
  validCheckValue?: (node: C) => any
) {
  const handler = useRef<number>();
  const abortController = useRef<AbortController>();
  const validCheck = validCheckValue ?? defaultValidCheck;
  useNodeChangeEffect(
    node,
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
    NodeChange.Value | NodeChange.Validate
  );
}

// Only allow strings and numbers
export type FinputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  state: ValueNode<string | number>;
};

export function Finput({ state, ...others }: FinputProps) {
  // Re-render on value or disabled state change
  useNodeStateVersion(state, NodeChange.Value | NodeChange.Disabled);

  // Update the HTML5 custom validity whenever the error message is changed/cleared
  useNodeChangeEffect(
    state,
    (s) =>
      (state.element as HTMLInputElement)?.setCustomValidity(state.error ?? ""),
    NodeChange.Error
  );
  return (
    <input
      ref={(r) => {
        state.element = r;
        if (r) r.setCustomValidity(state.error ?? "");
      }}
      value={state.value}
      disabled={state.disabled}
      onChange={(e) => state.setValue(e.currentTarget.value)}
      onBlur={() => state.setTouched(true)}
      {...others}
    />
  );
}

// Only allow strings and numbers
export type FselectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  state: ValueNode<string | number>;
};

export function Fselect({ state, children, ...others }: FselectProps) {
  // Re-render on value or disabled state change
  useNodeStateVersion(state, NodeChange.Value | NodeChange.Disabled);

  // Update the HTML5 custom validity whenever the error message is changed/cleared
  useNodeChangeEffect(
    state,
    (s) =>
      (s.element as HTMLSelectElement)?.setCustomValidity(state.error ?? ""),
    NodeChange.Error
  );
  return (
    <select
      ref={(r) => {
        state.element = r;
        if (r) r.setCustomValidity(state.error ?? "");
      }}
      value={state.value}
      disabled={state.disabled}
      onChange={(e) => state.setValue(e.currentTarget.value)}
      onBlur={() => state.setTouched(true)}
      {...others}
    >
      {children}
    </select>
  );
}
