import React, { Fragment, ReactElement, ReactNode } from "react";
import {
  ActionRendererProps,
  ArrayRendererProps,
  controlTitle,
  DataRendererProps,
  FormRendererComponents,
  GroupRendererProps,
  LabelRendererProps,
} from "./controlRender";
import clsx from "clsx";

export interface DataRendererRegistration {
  type: "data";
  schemaType?: string | string[];
  renderType?: string | string[];
  collection?: boolean;
  match?: (props: DataRendererProps) => boolean;
  render: (
    props: DataRendererProps,
    withLabel: (element: ReactElement) => ReactElement,
    others: () => FormRendererComponents,
  ) => ReactElement;
}

export interface LabelRendererRegistration {
  type: "label";
  render: (labelProps: LabelRendererProps) => ReactElement;
}

export interface ActionRendererRegistration {
  type: "action";
  render: (props: ActionRendererProps) => ReactElement;
}

export interface ArrayRendererRegistration {
  type: "array";
  render: (
    props: ArrayRendererProps,
    renderAction: (action: ActionRendererProps) => ReactElement,
  ) => ReactElement;
}

export function createRenderer(
  data: DataRendererRegistration,
  label: LabelRendererRegistration,
  action: ActionRendererRegistration,
  array: ArrayRendererRegistration,
): FormRendererComponents {
  function renderData(props: DataRendererProps) {
    const { control, required, visible, field } = props;
    const { title } = props.definition;
    return data.render(
      props,
      (children) =>
        renderLabel({
          children,
          control,
          required,
          visible,
          title: controlTitle(title, field),
        }),
      () => {
        throw "Not yet";
      },
    );
  }

  function renderLabel(props: LabelRendererProps) {
    return label.render(props);
  }

  function renderGroup(props: GroupRendererProps) {
    const { childCount, renderChild, definition, field, visible } = props;
    const title = props.hideTitle
      ? undefined
      : field
      ? controlTitle(definition.title, field)
      : definition.title;
    return renderLabel({
      visible,
      title,
      required: field?.required ?? false,
      children: props.array ? (
        renderArray(props.array)
      ) : (
        <div>
          {Array.from({ length: childCount }, (_, x) => renderChild(x))}
        </div>
      ),
    });
  }
  function renderArray(props: ArrayRendererProps) {
    return array.render(props, renderAction);
  }

  function renderAction(props: ActionRendererProps) {
    return action.render(props);
  }

  return {
    renderAction,
    renderData,
    renderGroup,
    renderLabel,
    renderDisplay: (props) => <div>Display</div>,
    renderArray,
  };
}

interface DefaultLabelRendererOptions {
  className?: string;
  required?: ReactNode;
  labelClass?: string;
}

export function createDefaultActionRenderer(
  className?: string,
): ActionRendererRegistration {
  function render({
    visible,
    onClick,
    definition: { title },
  }: ActionRendererProps) {
    return visible ? (
      <button className={className} onClick={onClick}>
        {title}
      </button>
    ) : (
      <></>
    );
  }
  return { render, type: "action" };
}
export function createDefaultLabelRenderer(
  options?: DefaultLabelRendererOptions,
): LabelRendererRegistration {
  const {
    className,
    labelClass,
    required: rm = <span> *</span>,
  } = options ?? {};
  function render({
    title,
    children,
    required,
    forId,
    visible,
  }: LabelRendererProps) {
    return visible ? (
      <div className={className}>
        {title && (
          <label htmlFor={forId} className={labelClass}>
            {title}
            {required && rm}
          </label>
        )}
        {children}
      </div>
    ) : (
      <></>
    );
  }
  return { render, type: "label" };
}

interface DefaultArrayRendererOptions {
  className?: string;
  removableClass?: string;
  childClass?: string;
  removableChildClass?: string;
  removeActionClass?: string;
  addActionClass?: string;
}

export function createDefaultArrayRenderer(
  options?: DefaultArrayRendererOptions,
): ArrayRendererRegistration {
  const {
    className,
    removableClass,
    childClass,
    removableChildClass,
    removeActionClass,
    addActionClass,
  } = options ?? {};
  function render(
    {
      childCount,
      renderChild,
      addAction,
      removeAction,
      childKey,
    }: ArrayRendererProps,
    renderAction: (action: ActionRendererProps) => ReactElement,
  ) {
    return (
      <>
        <div className={clsx(className, removeAction && removableClass)}>
          {Array.from({ length: childCount }, (_, x) =>
            removeAction ? (
              <Fragment key={childKey(x)}>
                <div className={clsx(childClass, removableChildClass)}>
                  {renderChild(x)}
                </div>
                <div className={removeActionClass}>
                  {renderAction(removeAction(x))}
                </div>
              </Fragment>
            ) : (
              <div key={childKey(x)} className={childClass}>
                {renderChild(x)}
              </div>
            ),
          )}
        </div>
        {addAction && (
          <div className={addActionClass}>{renderAction(addAction)}</div>
        )}
      </>
    );
  }
  return { render, type: "array" };
}
