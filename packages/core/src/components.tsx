import React, {
  Context,
  createContext,
  Key,
  ReactElement,
  ReactNode,
  useContext,
} from "react";
import {
  FormControlProps,
  formControlProps,
  useControlValue,
} from "./react-hooks";
import {Control, ControlValue} from "@astroapps/controls";

let _NotDefinedContext: Context<ReactNode> | null = null;

/** @noTrackControls */
export function NotDefinedContext() {
  if (!_NotDefinedContext) {
    _NotDefinedContext = createContext<ReactNode>(<></>);
  }
  return _NotDefinedContext;
}

export type RenderControlProps =
  | {
      children: () => ReactNode;
    }
  | {
      render: () => ReactNode;
    };
export function RenderControl(props: RenderControlProps) {
  return <>{("children" in props ? props.children : props.render)()}</>;
}

export function RenderValue<V>({
  toValue,
  children,
}: {
  toValue: (previous?: V) => V;
  children: (v: V) => ReactNode;
}) {
  const v = useControlValue(toValue);
  return <>{children(v)}</>;
}

/**
 * @deprecated Use formControlProps() directly
 */
export function RenderForm<V, E extends HTMLElement = HTMLElement>({
  control,
  children,
}: {
  control: Control<V>;
  children: (fcp: FormControlProps<V, E>) => ReactNode;
}) {
  return <>{children(formControlProps<V, E>(control))}</>;
}

/**
 * Optionally render based on whether the control contains a null or undefined.
 * Useful for rendering loading spinners.
 * @param control The control
 * @param render Callback to render if the value is not null
 * @param elseRender Content to render if the value is null
 */
export function RenderOptional<V>({
  control,
  children,
  notDefined,
}: {
  control: Control<V | undefined | null> | null | undefined;
  children: (c: Control<V>) => ReactNode;
  notDefined?: ReactNode;
}): ReactElement {
  const ndc = useContext(NotDefinedContext());
  return (
    <>
      {control && !control.isNull
        ? children(control as Control<V>)
        : notDefined ?? ndc}
    </>
  );
}

type ValuesOfControls<A> = { [K in keyof A]: NonNullable<ControlValue<A[K]>> };

/**
 * Given an object containing nullable value controls, optionally render if all controls are not null.
 * Useful for rendering loading spinners.
 * @param controls The object containing nullable controls.
 * @param render Callback which takes the non-null values of all the controls passed in.
 * @param elseRender Content to render if any value is null
 */
export function renderOptionally<A extends Record<string, Control<any>>>(
  controls: A,
  render: (v: ValuesOfControls<A>) => ReactNode,
  elseRender?: ReactNode
): () => ReactNode {
  return () => {
    const out: Record<string, any> = {};
    let ready = true;
    Object.entries(controls).forEach((x) => {
      const v = x[1].value;
      if (v != null) {
        out[x[0]] = v;
      } else ready = false;
    });
    return ready ? render(out as ValuesOfControls<A>) : elseRender ?? <></>;
  };
}

export interface RenderElementsProps<V> {
  control: Control<V[] | undefined | null>;
  children: (element: Control<V>, index: number, total: number) => ReactNode;
  notDefined?: ReactNode;
  empty?: ReactNode;
  container?: (children: ReactNode, elements: Control<V>[]) => ReactElement;
}

/**
 */
export function RenderElements<V>({
  control,
  children,
  notDefined,
  container = (children) => <>{children}</>,
  empty,
}: RenderElementsProps<V>) {
  const v = control.elements;
  const ndc = useContext(NotDefinedContext());
  notDefined ??= ndc;
  return v ? (
    container(v.length ? renderAll(v) : empty, v)
  ) : (
    <>{notDefined ?? empty}</>
  );

  function renderAll(v: Control<V>[]) {
    const total = v.length;
    return v.map((x, i) => (
      <RenderControl key={x.uniqueId}>
        {() => children(x, i, total)}
      </RenderControl>
    ));
  }
}

export interface RenderArrayElementsProps<V> {
  array: V[] | undefined | null;
  children: (element: V, index: number, total: number) => ReactNode;
  notDefined?: ReactNode;
  empty?: ReactNode;
  getKey?: (element: V, index: number) => Key;
  container?: (children: ReactNode, elements: V[]) => ReactElement;
}

/**
 */
export function RenderArrayElements<V>({
  array,
  children,
  notDefined,
  container = (children) => <>{children}</>,
  getKey = (_, i) => i,
  empty,
}: RenderArrayElementsProps<V>) {
  const ndc = useContext(NotDefinedContext());
  notDefined ??= ndc;
  return array ? (
    container(array.length ? renderAll(array) : empty, array)
  ) : (
    <>{notDefined ?? empty}</>
  );

  function renderAll(v: V[]) {
    const total = v.length;
    return v.map((x, i) => (
      <RenderControl key={getKey(x, i)}>
        {() => children(x, i, total)}
      </RenderControl>
    ));
  }
}
