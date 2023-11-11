import React, { CSSProperties, Fragment, ReactElement, ReactNode } from "react";
import {
  ActionRendererProps,
  ArrayRendererProps,
  controlTitle,
  DataRendererProps,
  DisplayRendererProps,
  FormRendererComponents,
  GroupRendererProps,
  LabelRendererProps,
  Visibility,
} from "./controlRender";
import clsx from "clsx";
import {
  DataRenderType,
  DisplayDataType,
  GridRenderer,
  HtmlDisplay,
  isGridRenderer,
  TextDisplay,
} from "./types";
import { Finput } from "@react-typed-forms/core";

export interface DefaultRenderers {
  data: DataRendererRegistration;
  label: LabelRendererRegistration;
  action: ActionRendererRegistration;
  array: ArrayRendererRegistration;
  group: GroupRendererRegistration;
  display: DisplayRendererRegistration;
  visibility: VisibilityRendererRegistration;
}
export interface DataRendererRegistration {
  type: "data";
  schemaType?: string | string[];
  renderType?: string | string[];
  collection?: boolean;
  match?: (props: DataRendererProps) => boolean;
  render: (
    props: DataRendererProps,
    defaultLabel: (label?: Partial<LabelRendererProps>) => LabelRendererProps,
    renderers: Pick<
      FormRendererComponents,
      "renderArray" | "renderData" | "renderLabel" | "renderVisibility"
    >,
  ) => ReactElement;
}

export interface LabelRendererRegistration {
  type: "label";
  render: (
    labelProps: LabelRendererProps,
    renderers: Pick<FormRendererComponents, "renderVisibility">,
  ) => ReactElement;
}

export interface ActionRendererRegistration {
  type: "action";
  render: (
    props: ActionRendererProps,
    renderers: Pick<FormRendererComponents, "renderVisibility">,
  ) => ReactElement;
}

export interface ArrayRendererRegistration {
  type: "array";
  render: (
    props: ArrayRendererProps,
    renderers: Pick<FormRendererComponents, "renderAction">,
  ) => ReactElement;
}

export interface GroupRendererRegistration {
  type: "group";
  render: (
    props: GroupRendererProps,
    renderers: Pick<
      FormRendererComponents,
      "renderLabel" | "renderArray" | "renderGroup"
    >,
  ) => ReactElement;
}

export interface DisplayRendererRegistration {
  type: "display";
  render: (
    props: DisplayRendererProps,
    renderers: Pick<FormRendererComponents, "renderVisibility">,
  ) => ReactElement;
}

export interface VisibilityRendererRegistration {
  type: "visibility";
  render: (visible: Visibility, elem: ReactElement) => ReactElement;
}

export type AnyRendererRegistration =
  | DataRendererRegistration
  | GroupRendererRegistration
  | DisplayRendererRegistration
  | ActionRendererRegistration
  | LabelRendererRegistration
  | ArrayRendererRegistration
  | VisibilityRendererRegistration;

export function createRenderer(
  customRenderers: AnyRendererRegistration[] = [],
  defaultRenderers: DefaultRenderers = createClassStyledRenderers(),
): FormRendererComponents {
  const dataRegistrations = customRenderers.filter(isDataRegistration);
  const labelRenderer =
    customRenderers.find(isLabelRegistration) ?? defaultRenderers.label;
  const renderVisibility = (
    customRenderers.find(isVisibilityRegistration) ??
    defaultRenderers.visibility
  ).render;
  function renderData(props: DataRendererProps) {
    const { definition, visible, required, control, field } = props;
    const renderType =
      definition.renderOptions?.type ?? DataRenderType.Standard;

    const renderer =
      dataRegistrations.find(
        (x) =>
          (x.collection ?? false) === (field.collection ?? false) &&
          isOneOf(x.schemaType, field.type) &&
          isOneOf(x.renderType, renderType) &&
          (!x.match || x.match(props)),
      ) ?? defaultRenderers.data;

    return renderer.render(
      props,
      (labelProps) => ({
        visible,
        required,
        control,
        ...labelProps,
        title: labelProps?.title ?? controlTitle(definition.title, field),
      }),
      { renderData, renderLabel, renderArray, renderVisibility },
    );
  }

  function renderLabel(props: LabelRendererProps) {
    return labelRenderer.render(props, {
      renderVisibility,
    });
  }

  function renderGroup(props: GroupRendererProps) {
    return defaultRenderers.group.render(props, {
      renderLabel,
      renderArray,
      renderGroup,
    });
  }

  function renderArray(props: ArrayRendererProps) {
    return defaultRenderers.array.render(props, { renderAction });
  }

  function renderAction(props: ActionRendererProps) {
    const renderer =
      customRenderers.find(isActionRegistration) ?? defaultRenderers.action;
    return renderer.render(props, { renderVisibility });
  }

  function renderDisplay(props: DisplayRendererProps) {
    return defaultRenderers.display.render(props, { renderVisibility });
  }

  return {
    renderAction,
    renderData,
    renderGroup,
    renderDisplay,
    renderLabel,
    renderArray,
    renderVisibility,
  };
}

interface DefaultLabelRendererOptions {
  className?: string;
  requiredElement?: ReactNode;
  labelClass?: string;
}

interface DefaultActionRendererOptions {
  className?: string;
}

export function createDefaultActionRenderer(
  options: DefaultActionRendererOptions = {},
): ActionRendererRegistration {
  function render(
    { visible, onClick, definition: { title } }: ActionRendererProps,
    { renderVisibility }: Pick<FormRendererComponents, "renderVisibility">,
  ) {
    return renderVisibility(
      visible,
      <button className={options.className} onClick={onClick}>
        {title}
      </button>,
    );
  }
  return { render, type: "action" };
}
export function createDefaultLabelRenderer(
  options: DefaultLabelRendererOptions = { requiredElement: <span> *</span> },
): LabelRendererRegistration {
  return {
    render: (p, { renderVisibility }) =>
      renderVisibility(p.visible, <DefaultLabelRenderer {...p} {...options} />),
    type: "label",
  };
}

export function DefaultLabelRenderer({
  children,
  className,
  labelClass,
  title,
  forId,
  required,
  requiredElement,
}: LabelRendererProps & DefaultLabelRendererOptions) {
  return title ? (
    <div className={className}>
      <label htmlFor={forId} className={labelClass}>
        {title}
        {required && requiredElement}
      </label>
      {children}
    </div>
  ) : (
    <>{children}</>
  );
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
    { renderAction }: Pick<FormRendererComponents, "renderAction">,
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

interface StyleProps {
  className?: string;
  style?: CSSProperties;
}

interface DefaultGroupRendererOptions {
  className?: string;
  standardClassName?: string;
  gridStyles?: (columns: GridRenderer) => StyleProps;
  gridClassName?: string;
  defaultGridColumns?: number;
}

export function createDefaultGroupRenderer(
  options?: DefaultGroupRendererOptions,
): GroupRendererRegistration {
  const {
    className,
    gridStyles = defaultGridStyles,
    defaultGridColumns = 2,
    gridClassName,
    standardClassName,
  } = options ?? {};

  function defaultGridStyles({
    columns = defaultGridColumns,
  }: GridRenderer): StyleProps {
    return {
      className: gridClassName,
      style: {
        display: "grid",
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
      },
    };
  }

  function render(
    props: GroupRendererProps,
    {
      renderLabel,
      renderArray,
    }: Pick<
      FormRendererComponents,
      "renderLabel" | "renderArray" | "renderGroup"
    >,
  ) {
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
      children: props.array ? renderArray(props.array) : renderChildren(),
    });

    function renderChildren() {
      const { groupOptions } = definition;
      const { style, className: gcn } = isGridRenderer(groupOptions)
        ? gridStyles(groupOptions)
        : ({ className: standardClassName } satisfies StyleProps);
      return (
        <div className={clsx(className, gcn)} style={style}>
          {Array.from({ length: childCount }, (_, x) => renderChild(x))}
        </div>
      );
    }
  }
  return { type: "group", render };
}

export interface DefaultDisplayRendererOptions {
  textClassName?: string;
  htmlClassName?: string;
}
export function createDefaultDisplayRenderer(
  options: DefaultDisplayRendererOptions = {},
): DisplayRendererRegistration {
  function doRender({ definition: { displayData } }: DisplayRendererProps) {
    switch (displayData.type) {
      case DisplayDataType.Text:
        return (
          <div className={options.textClassName}>
            {(displayData as TextDisplay).text}
          </div>
        );
      case DisplayDataType.Html:
        return (
          <div
            className={options.htmlClassName}
            dangerouslySetInnerHTML={{
              __html: (displayData as HtmlDisplay).html,
            }}
          />
        );
      default:
        return <h1>Unknown display type: {displayData.type}</h1>;
    }
  }
  return {
    render: (p, { renderVisibility }) =>
      renderVisibility(p.visible, doRender(p)),
    type: "display",
  };
}

interface DefaultDataRendererOptions {}
export function createDefaultDataRenderer(
  options: DefaultDataRendererOptions = {},
): DataRendererRegistration {
  function render(
    props: DataRendererProps,
    defaultLabel: (props: Partial<LabelRendererProps>) => LabelRendererProps,
    {
      renderLabel,
    }: Pick<
      FormRendererComponents,
      "renderArray" | "renderData" | "renderLabel"
    >,
  ) {
    return renderLabel(
      defaultLabel({ children: <Finput control={props.control} /> }),
    );
  }
  return { render, type: "data" };
}

export interface DefaultVisibilityRendererOptions {}

export function createDefaultVisibilityRenderer(
  options: DefaultVisibilityRendererOptions = {},
): VisibilityRendererRegistration {
  return {
    type: "visibility",
    render: (visible, children) => (visible.value ? children : <></>),
  };
}

interface DefaultRendererOptions {
  data?: DefaultDataRendererOptions;
  display?: DefaultDisplayRendererOptions;
  action?: DefaultActionRendererOptions;
  array?: DefaultArrayRendererOptions;
  group?: DefaultGroupRendererOptions;
  label?: DefaultLabelRendererOptions;
  visibility?: DefaultVisibilityRendererOptions;
}

export function createDefaultRenderers(
  options: DefaultRendererOptions = {},
): DefaultRenderers {
  return {
    data: createDefaultDataRenderer(options.data),
    display: createDefaultDisplayRenderer(options.display),
    action: createDefaultActionRenderer(options.action),
    array: createDefaultArrayRenderer(options.array),
    group: createDefaultGroupRenderer(options.group),
    label: createDefaultLabelRenderer(options.label),
    visibility: createDefaultVisibilityRenderer(options.visibility),
  };
}

function createClassStyledRenderers() {
  return createDefaultRenderers({
    label: { className: "control" },
    group: { className: "group" },
    array: { className: "control-array" },
    action: { className: "action" },
    data: { className: "data" },
    display: { htmlClassName: "html", textClassName: "text" },
  });
}

function isDataRegistration(
  x: AnyRendererRegistration,
): x is DataRendererRegistration {
  return x.type === "data";
}

function isLabelRegistration(
  x: AnyRendererRegistration,
): x is LabelRendererRegistration {
  return x.type === "label";
}

function isActionRegistration(
  x: AnyRendererRegistration,
): x is ActionRendererRegistration {
  return x.type === "action";
}

function isVisibilityRegistration(
  x: AnyRendererRegistration,
): x is VisibilityRendererRegistration {
  return x.type === "visibility";
}

function isOneOf(x: string | string[] | undefined, v: string) {
  return x == null ? true : Array.isArray(x) ? x.includes(v) : v === x;
}
