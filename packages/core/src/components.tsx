import React, {
  createContext,
  ReactElement,
  ReactNode,
  useContext,
} from "react";
import { Control, ControlValue } from "./types";
import {
  FormControlProps,
  formControlProps,
  useControlValue,
} from "./react-hooks";

export const NotDefinedContext = createContext<ReactNode>(<></>);

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
  control: Control<V | undefined | null>;
  children: (c: Control<V>) => ReactNode;
  notDefined?: ReactNode;
}): ReactElement {
  const o = control.optional;
  notDefined ??= useContext(NotDefinedContext);
  return <>{o ? children(o) : notDefined}</>;
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
  const v = control.optional?.elements;
  notDefined ??= useContext(NotDefinedContext);
  return v ? (
    container(v.length ? renderAll(v) : empty, v)
  ) : (
    <>{notDefined ? notDefined : empty}</>
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
