import React, {
  ReactElement,
  FC,
  useRef,
  useMemo,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { BaseNode, NodeChange, Node, ArrayNode } from "./nodes";

export function useNodeChangeEffect<Node extends BaseNode>(
  node: Node,
  changeEffect: (node: Node, change: NodeChange) => void,
  mask?: NodeChange,
  deps?: any[]
) {
  const updater = useMemo(() => changeEffect, deps ?? [node]);
  useEffect(() => {
    node.addChangeListener(updater, mask);
    return () => node.removeChangeListener(updater);
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

export function useNodeValue<A>(node: Node<A>, mask?: NodeChange) {
  return useNodeState(node, (n) => n.value, mask);
}

export function useNodeStateVersion(control: BaseNode, mask?: NodeChange) {
  return useNodeState(control, (c) => c.stateVersion, mask);
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
  return n instanceof Node ? n.value : n.stateVersion;
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
  state: Node<string | number>;
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
  state: Node<string | number>;
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
