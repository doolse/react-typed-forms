import React, {
  CSSProperties,
  Fragment,
  ReactElement,
  ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";
import clsx from "clsx";
import { Control, Fcheckbox, formControlProps } from "@react-typed-forms/core";
import {
  ActionRendererProps,
  AdornmentProps,
  AdornmentRenderer,
  appendMarkupAt,
  ArrayRendererProps,
  ControlLayoutProps,
  DataRendererProps,
  DisplayRendererProps,
  FormRenderer,
  GroupRendererProps,
  LabelRendererProps,
  LabelType,
  RenderedControl,
  RenderedLayout,
  renderLayoutParts,
  VisibilityRendererProps,
} from "./controlRender";
import {
  AdornmentPlacement,
  ControlAdornment,
  ControlAdornmentType,
  DataRenderType,
  DisplayDataType,
  FieldOption,
  FieldType,
  FlexRenderer,
  GridRenderer,
  HtmlDisplay,
  IconAdornment,
  IconDisplay,
  isDisplayOnlyRenderer,
  isFlexRenderer,
  isGridRenderer,
  SchemaField,
  SchemaInterface,
  TextDisplay,
} from "./types";
import { hasOptions } from "./util";

export interface DefaultRenderers {
  data: DataRendererRegistration;
  label: LabelRendererRegistration;
  action: ActionRendererRegistration;
  array: ArrayRendererRegistration;
  group: GroupRendererRegistration;
  display: DisplayRendererRegistration;
  adornment: AdornmentRendererRegistration;
  renderLayout: LayoutRendererRegistration;
  visibility: VisibilityRendererRegistration;
}

export interface LayoutRendererRegistration {
  type: "layout";
  match?: (props: ControlLayoutProps) => boolean;
  render: (
    props: ControlLayoutProps,
    renderers: FormRenderer,
  ) => RenderedControl;
}
export interface DataRendererRegistration {
  type: "data";
  schemaType?: string | string[];
  renderType?: string | string[];
  options?: boolean;
  collection?: boolean;
  match?: (props: DataRendererProps) => boolean;
  render: (
    props: DataRendererProps,
    renderers: FormRenderer,
  ) => ReactNode | ((layout: ControlLayoutProps) => ControlLayoutProps);
}

export interface LabelRendererRegistration {
  type: "label";
  labelType?: LabelType | LabelType[];
  render: (
    labelProps: LabelRendererProps,
    labelStart: ReactNode,
    labelEnd: ReactNode,
    renderers: FormRenderer,
  ) => ReactElement;
}

export interface ActionRendererRegistration {
  type: "action";
  actionType?: string | string[];
  render: (props: ActionRendererProps, renderers: FormRenderer) => ReactElement;
}

export interface ArrayRendererRegistration {
  type: "array";
  render: (props: ArrayRendererProps, renderers: FormRenderer) => ReactElement;
}

export interface GroupRendererRegistration {
  type: "group";
  renderType?: string | string[];
  render: (
    props: GroupRendererProps,
    renderers: FormRenderer,
  ) => ReactElement | ((layout: ControlLayoutProps) => ControlLayoutProps);
}

export interface DisplayRendererRegistration {
  type: "display";
  renderType?: string | string[];
  render: (
    props: DisplayRendererProps,
    renderers: FormRenderer,
  ) => ReactElement;
}

export interface AdornmentRendererRegistration {
  type: "adornment";
  adornmentType?: string | string[];
  render: (props: AdornmentProps) => AdornmentRenderer;
}

export interface VisibilityRendererRegistration {
  type: "visibility";
  render: (props: VisibilityRendererProps) => ReactNode;
}

export type RendererRegistration =
  | DataRendererRegistration
  | GroupRendererRegistration
  | DisplayRendererRegistration
  | ActionRendererRegistration
  | LabelRendererRegistration
  | ArrayRendererRegistration
  | AdornmentRendererRegistration
  | LayoutRendererRegistration
  | VisibilityRendererRegistration;

export function createFormRenderer(
  customRenderers: RendererRegistration[] = [],
  defaultRenderers: DefaultRenderers = createClassStyledRenderers(),
): FormRenderer {
  const dataRegistrations = customRenderers.filter(isDataRegistration);
  const groupRegistrations = customRenderers.filter(isGroupRegistration);
  const adornmentRegistrations = customRenderers.filter(
    isAdornmentRegistration,
  );
  const displayRegistrations = customRenderers.filter(isDisplayRegistration);
  const labelRenderers = customRenderers.filter(isLabelRegistration);
  const arrayRenderers = customRenderers.filter(isArrayRegistration);
  const actionRenderers = customRenderers.filter(isActionRegistration);
  const layoutRenderers = customRenderers.filter(isLayoutRegistration);
  const visibilityRenderer =
    customRenderers.find(isVisibilityRegistration) ??
    defaultRenderers.visibility;

  const formRenderers: FormRenderer = {
    renderAction,
    renderData,
    renderGroup,
    renderDisplay,
    renderLabel,
    renderArray,
    renderAdornment,
    renderLayout,
    renderVisibility: visibilityRenderer.render,
  };

  function renderLayout(props: ControlLayoutProps) {
    const renderer =
      layoutRenderers.find((x) => !x.match || x.match(props)) ??
      defaultRenderers.renderLayout;
    return renderer.render(props, formRenderers);
  }

  function renderAdornment(props: AdornmentProps): AdornmentRenderer {
    const renderer =
      adornmentRegistrations.find((x) =>
        isOneOf(x.adornmentType, props.adornment.type),
      ) ?? defaultRenderers.adornment;
    return renderer.render(props);
  }

  function renderArray(props: ArrayRendererProps) {
    return (arrayRenderers[0] ?? defaultRenderers.array).render(
      props,
      formRenderers,
    );
  }

  function renderLabel(
    props: LabelRendererProps,
    labelStart: ReactNode,
    labelEnd: ReactNode,
  ) {
    const renderer =
      labelRenderers.find((x) => isOneOf(x.labelType, props.type)) ??
      defaultRenderers.label;
    return renderer.render(props, labelStart, labelEnd, formRenderers);
  }

  function renderData(
    props: DataRendererProps,
  ): (layout: ControlLayoutProps) => ControlLayoutProps {
    const {
      renderOptions: { type: renderType },
      field,
    } = props;

    const options = hasOptions(props);
    const renderer =
      dataRegistrations.find(
        (x) =>
          (x.collection ?? false) === (field.collection ?? false) &&
          (x.options ?? false) === options &&
          isOneOf(x.schemaType, field.type) &&
          isOneOf(x.renderType, renderType) &&
          (!x.match || x.match(props)),
      ) ?? defaultRenderers.data;

    const result = renderer.render(props, formRenderers);
    if (typeof result === "function") return result;
    return (l) => ({ ...l, children: result });
  }

  function renderGroup(
    props: GroupRendererProps,
  ): (layout: ControlLayoutProps) => ControlLayoutProps {
    const renderType = props.renderOptions.type;
    const renderer =
      groupRegistrations.find((x) => isOneOf(x.renderType, renderType)) ??
      defaultRenderers.group;
    const result = renderer.render(props, formRenderers);
    if (typeof result === "function") return result;
    return (l) => ({ ...l, children: result });
  }

  function renderAction(props: ActionRendererProps) {
    const renderer =
      actionRenderers.find((x) => isOneOf(x.actionType, props.actionId)) ??
      defaultRenderers.action;
    return renderer.render(props, formRenderers);
  }

  function renderDisplay(props: DisplayRendererProps) {
    const renderType = props.data.type;
    const renderer =
      displayRegistrations.find((x) => isOneOf(x.renderType, renderType)) ??
      defaultRenderers.display;
    return renderer.render(props, formRenderers);
  }

  return formRenderers;
}

interface DefaultLabelRendererOptions {
  className?: string;
  groupLabelClass?: string;
  requiredElement?: ReactNode;
}

interface DefaultActionRendererOptions {
  className?: string;
}

export function createDefaultActionRenderer(
  options: DefaultActionRendererOptions = {},
): ActionRendererRegistration {
  function render({ onClick, actionText }: ActionRendererProps) {
    return (
      <button className={options.className} onClick={onClick}>
        {actionText}
      </button>
    );
  }
  return { render, type: "action" };
}
export function createDefaultLabelRenderer(
  options: DefaultLabelRendererOptions = { requiredElement: <span> *</span> },
): LabelRendererRegistration {
  const { className, groupLabelClass, requiredElement } = options;
  return {
    render: (props, labelStart, labelEnd) => (
      <>
        {labelStart}
        <label
          htmlFor={props.forId}
          className={clsx(
            className,
            props.type === LabelType.Group && groupLabelClass,
          )}
        >
          {props.label}
          {props.required && requiredElement}
        </label>
        {labelEnd}
      </>
    ),
    type: "label",
  };
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
      elementCount,
      renderElement,
      addAction,
      removeAction,
      elementKey,
      required,
    }: ArrayRendererProps,
    { renderAction }: FormRenderer,
  ) {
    const showRemove = !required || elementCount > 1;
    return (
      <div>
        <div className={clsx(className, removeAction && removableClass)}>
          {Array.from({ length: elementCount }, (_, x) =>
            removeAction ? (
              <Fragment key={elementKey(x)}>
                <div className={clsx(childClass, removableChildClass)}>
                  {renderElement(x)}
                </div>
                <div className={removeActionClass}>
                  {showRemove && renderAction(removeAction(x))}
                </div>
              </Fragment>
            ) : (
              <div key={elementKey(x)} className={childClass}>
                {renderElement(x)}
              </div>
            ),
          )}
        </div>
        {addAction && (
          <div className={addActionClass}>{renderAction(addAction)}</div>
        )}
      </div>
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
  flexClassName?: string;
  defaultFlexGap?: string;
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
    flexClassName,
    defaultFlexGap,
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

  function flexStyles(options: FlexRenderer): StyleProps {
    return {
      className: flexClassName,
      style: {
        display: "flex",
        gap: options.gap ? options.gap : defaultFlexGap,
        flexDirection: options.direction
          ? (options.direction as any)
          : undefined,
      },
    };
  }

  function render(props: GroupRendererProps) {
    const { childCount, renderChild, renderOptions } = props;

    const { style, className: gcn } = isGridRenderer(renderOptions)
      ? gridStyles(renderOptions)
      : isFlexRenderer(renderOptions)
      ? flexStyles(renderOptions)
      : ({ className: standardClassName } as StyleProps);

    return (cp: ControlLayoutProps) => {
      return {
        ...cp,
        children: (
          <div className={clsx(props.className, className, gcn)} style={style}>
            {Array.from({ length: childCount }, (_, x) => renderChild(x))}
          </div>
        ),
      };
    };
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
  return {
    render: (props) => <DefaultDisplay {...options} {...props} />,
    type: "display",
  };
}

export function DefaultDisplay({
  data,
  display,
  className,
  style,
  ...options
}: DefaultDisplayRendererOptions & DisplayRendererProps) {
  switch (data.type) {
    case DisplayDataType.Icon:
      return (
        <i
          style={style}
          className={clsx(
            className,
            display ? display.value : (data as IconDisplay).iconClass,
          )}
        />
      );
    case DisplayDataType.Text:
      return (
        <div style={style} className={clsx(className, options.textClassName)}>
          {display ? display.value : (data as TextDisplay).text}
        </div>
      );
    case DisplayDataType.Html:
      return (
        <div
          style={style}
          className={clsx(className, options.htmlClassName)}
          dangerouslySetInnerHTML={{
            __html: display ? display.value ?? "" : (data as HtmlDisplay).html,
          }}
        />
      );
    default:
      return <h1>Unknown display type: {data.type}</h1>;
  }
}

export const DefaultBoolOptions: FieldOption[] = [
  { name: "Yes", value: true },
  { name: "No", value: false },
];
interface DefaultDataRendererOptions {
  inputClass?: string;
  displayOnlyClass?: string;
  selectOptions?: SelectRendererOptions;
  booleanOptions?: FieldOption[];
  optionRenderer?: DataRendererRegistration;
}

export function createDefaultDataRenderer(
  options: DefaultDataRendererOptions = {},
): DataRendererRegistration {
  const selectRenderer = createSelectRenderer(options.selectOptions ?? {});
  const { inputClass, booleanOptions, optionRenderer, displayOnlyClass } = {
    optionRenderer: selectRenderer,
    booleanOptions: DefaultBoolOptions,
    ...options,
  };
  return createDataRenderer((props, renderers) => {
    const fieldType = props.field.type;
    if (props.toArrayProps) {
      return (p) => ({
        ...p,
        children: renderers.renderArray(props.toArrayProps!()),
      });
    }
    if (fieldType === FieldType.Compound) {
      return renderers.renderGroup({
        style: props.style,
        className: props.className,
        renderOptions: { type: "Standard", hideTitle: true },
        renderChild: (i) => props.renderChild(i, i, { control: props.control }),
        childCount: props.childCount,
      });
    }
    const renderOptions = props.renderOptions;
    let renderType = renderOptions.type;
    if (fieldType == FieldType.Any) return <>No control for Any</>;
    if (isDisplayOnlyRenderer(renderOptions))
      return (p) => ({
        ...p,
        className: displayOnlyClass,
        children: (
          <DefaultDisplayOnly
            field={props.field}
            schemaInterface={props.dataContext.schemaInterface}
            control={props.control}
            className={props.className}
            style={props.style}
            emptyText={renderOptions.emptyText}
          />
        ),
      });
    const isBool = fieldType === FieldType.Bool;
    if (booleanOptions != null && isBool && props.options == null) {
      return renderers.renderData({ ...props, options: booleanOptions });
    }
    if (renderType === DataRenderType.Standard && hasOptions(props)) {
      return optionRenderer.render(props, renderers);
    }
    switch (renderType) {
      case DataRenderType.Dropdown:
        return selectRenderer.render(props, renderers);
    }
    return renderType === DataRenderType.Checkbox ? (
      <Fcheckbox
        style={props.style}
        className={props.className}
        control={props.control}
      />
    ) : (
      <ControlInput
        className={clsx(props.className, inputClass)}
        style={props.style}
        id={props.id}
        readOnly={props.readonly}
        control={props.control}
        convert={createInputConversion(props.field.type)}
      />
    );
  });
}

export function DefaultDisplayOnly({
  control,
  className,
  emptyText,
  schemaInterface,
  field,
  style,
}: {
  control: Control<any>;
  field: SchemaField;
  schemaInterface: SchemaInterface;
  className?: string;
  style?: React.CSSProperties;
  emptyText?: string | null;
}) {
  const v = control.value;
  const text =
    (schemaInterface.isEmptyValue(field, v)
      ? emptyText
      : schemaInterface.textValue(field, v)) ?? "";
  return (
    <div style={style} className={className}>
      {text}
    </div>
  );
}

export function ControlInput({
  control,
  convert,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  control: Control<any>;
  convert: InputConversion;
}) {
  const { errorText, value, onChange, ...inputProps } =
    formControlProps(control);
  return (
    <input
      {...inputProps}
      type={convert[0]}
      value={value == null ? "" : convert[2](value)}
      onChange={(e) => {
        control.value = convert[1](e.target.value);
      }}
      {...props}
    />
  );
}

export interface DefaultAdornmentRendererOptions {}

export function createDefaultAdornmentRenderer(
  options: DefaultAdornmentRendererOptions = {},
): AdornmentRendererRegistration {
  return {
    type: "adornment",
    render: ({ adornment }) => ({
      apply: (rl) => {
        if (isIconAdornment(adornment)) {
          return appendMarkupAt(
            adornment.placement ?? AdornmentPlacement.ControlStart,
            <i className={adornment.iconClass} />,
          )(rl);
        }
      },
      priority: 0,
      adornment,
    }),
  };
}

export interface DefaultLayoutRendererOptions {
  className?: string;
  errorClass?: string;
}

export interface DefaultRendererOptions {
  data?: DefaultDataRendererOptions;
  display?: DefaultDisplayRendererOptions;
  action?: DefaultActionRendererOptions;
  array?: DefaultArrayRendererOptions;
  group?: DefaultGroupRendererOptions;
  label?: DefaultLabelRendererOptions;
  adornment?: DefaultAdornmentRendererOptions;
  layout?: DefaultLayoutRendererOptions;
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
    adornment: createDefaultAdornmentRenderer(options.adornment),
    renderLayout: createDefaultLayoutRenderer(options.layout),
    visibility: createDefaultVisibilityRenderer(),
  };
}

function createDefaultLayoutRenderer(
  options: DefaultLayoutRendererOptions = {},
) {
  return createLayoutRenderer((props, renderers) => {
    const layout = renderLayoutParts(
      { ...props, className: clsx(props.className, options.className) },
      renderers,
    );
    return {
      children: <DefaultLayout layout={layout} {...options} />,
      className: layout.className,
      style: layout.style,
      divRef: (e) =>
        e && props.errorControl
          ? (props.errorControl.meta.scrollElement = e)
          : undefined,
    };
  });
}

function createClassStyledRenderers() {
  return createDefaultRenderers({
    layout: { className: "control" },
    group: { className: "group" },
    array: { className: "control-array" },
    action: { className: "action" },
    data: { inputClass: "data" },
    display: { htmlClassName: "html", textClassName: "text" },
  });
}

function isAdornmentRegistration(
  x: RendererRegistration,
): x is AdornmentRendererRegistration {
  return x.type === "adornment";
}

function isDataRegistration(
  x: RendererRegistration,
): x is DataRendererRegistration {
  return x.type === "data";
}

function isGroupRegistration(
  x: RendererRegistration,
): x is GroupRendererRegistration {
  return x.type === "group";
}

function isLabelRegistration(
  x: RendererRegistration,
): x is LabelRendererRegistration {
  return x.type === "label";
}

function isLayoutRegistration(
  x: RendererRegistration,
): x is LayoutRendererRegistration {
  return x.type === "layout";
}

function isVisibilityRegistration(
  x: RendererRegistration,
): x is VisibilityRendererRegistration {
  return x.type === "visibility";
}

function isActionRegistration(
  x: RendererRegistration,
): x is ActionRendererRegistration {
  return x.type === "action";
}

function isDisplayRegistration(
  x: RendererRegistration,
): x is DisplayRendererRegistration {
  return x.type === "display";
}

function isArrayRegistration(
  x: RendererRegistration,
): x is ArrayRendererRegistration {
  return x.type === "array";
}
function isOneOf<A>(x: A | A[] | undefined, v: A) {
  return x == null ? true : Array.isArray(x) ? x.includes(v) : v === x;
}

export function isIconAdornment(a: ControlAdornment): a is IconAdornment {
  return a.type === ControlAdornmentType.Icon;
}

export function createLayoutRenderer(
  render: LayoutRendererRegistration["render"],
  options?: Partial<LayoutRendererRegistration>,
): LayoutRendererRegistration {
  return { type: "layout", render, ...options };
}

export function createArrayRenderer(
  render: ArrayRendererRegistration["render"],
  options?: Partial<ArrayRendererRegistration>,
): ArrayRendererRegistration {
  return { type: "array", render, ...options };
}

export function createDataRenderer(
  render: DataRendererRegistration["render"],
  options?: Partial<DataRendererRegistration>,
): DataRendererRegistration {
  return { type: "data", render, ...options };
}

export function createLabelRenderer(
  render: LabelRendererRegistration["render"],
  options?: Omit<LabelRendererRegistration, "type">,
): LabelRendererRegistration {
  return { type: "label", render, ...options };
}

export function createVisibilityRenderer(
  render: VisibilityRendererRegistration["render"],
  options?: Partial<VisibilityRendererRegistration>,
): VisibilityRendererRegistration {
  return { type: "visibility", render, ...options };
}

export function createAdornmentRenderer(
  render: (props: AdornmentProps) => AdornmentRenderer,
  options?: Partial<AdornmentRendererRegistration>,
): AdornmentRendererRegistration {
  return { type: "adornment", ...options, render };
}

export interface SelectRendererOptions {
  className?: string;
  emptyText?: string;
  requiredText?: string;
}

export function createSelectRenderer(options: SelectRendererOptions = {}) {
  return createDataRenderer(
    (props, asArray) => (
      <SelectDataRenderer
        className={clsx(props.className, options.className)}
        state={props.control}
        id={props.id}
        options={props.options!}
        required={props.required}
        emptyText={options.emptyText}
        requiredText={options.requiredText}
        convert={createSelectConversion(props.field.type)}
      />
    ),
    {
      options: true,
    },
  );
}

type SelectConversion = (a: any) => string | number;

interface SelectDataRendererProps {
  id?: string;
  className?: string;
  options: {
    name: string;
    value: any;
    disabled?: boolean;
  }[];
  emptyText?: string;
  requiredText?: string;
  required: boolean;
  state: Control<any>;
  convert: SelectConversion;
}

export function SelectDataRenderer({
  state,
  options,
  className,
  convert,
  required,
  emptyText = "N/A",
  requiredText = "<please select>",
  ...props
}: SelectDataRendererProps) {
  const { value, disabled } = state;
  const [showEmpty] = useState(!required || value == null);
  const optionStringMap = useMemo(
    () => Object.fromEntries(options.map((x) => [convert(x.value), x.value])),
    [options],
  );
  return (
    <select
      {...props}
      className={className}
      onChange={(v) => (state.value = optionStringMap[v.target.value])}
      value={convert(value)}
      disabled={disabled}
    >
      {showEmpty && (
        <option value="">{required ? requiredText : emptyText}</option>
      )}
      {options.map((x, i) => (
        <option key={i} value={convert(x.value)} disabled={x.disabled}>
          {x.name}
        </option>
      ))}
    </select>
  );
}

export function createSelectConversion(ft: string): SelectConversion {
  switch (ft) {
    case FieldType.String:
    case FieldType.Int:
    case FieldType.Double:
      return (a) => a;
    default:
      return (a) => a?.toString() ?? "";
  }
}

type InputConversion = [string, (s: any) => any, (a: any) => string | number];

export function createInputConversion(ft: string): InputConversion {
  switch (ft) {
    case FieldType.String:
      return ["text", (a) => a, (a) => a];
    case FieldType.Bool:
      return ["text", (a) => a === "true", (a) => a?.toString() ?? ""];
    case FieldType.Int:
      return [
        "number",
        (a) => (a !== "" ? parseInt(a) : null),
        (a) => (a == null ? "" : a),
      ];
    case FieldType.Date:
      return ["date", (a) => a, (a) => a];
    case FieldType.Double:
      return ["number", (a) => parseFloat(a), (a) => a];
    default:
      return ["text", (a) => a, (a) => a];
  }
}

export function createDefaultVisibilityRenderer() {
  return createVisibilityRenderer((props) => <DefaultVisibility {...props} />);
}

export function DefaultVisibility({
  visibility,
  children,
  className,
  style,
  divRef,
}: VisibilityRendererProps) {
  const v = visibility.value;
  useEffect(() => {
    if (v) {
      visibility.setValue((ex) => ({ visible: v.visible, showing: v.visible }));
    }
  }, [v?.visible]);
  return v?.visible ? (
    <div className={clsx(className)} style={style} ref={divRef}>
      {children}
    </div>
  ) : (
    <></>
  );
}

export function DefaultLayout({
  errorClass,
  className,
  layout: { controlEnd, controlStart, label, children, errorControl },
}: DefaultLayoutRendererOptions & {
  layout: RenderedLayout;
}) {
  const ec = errorControl;
  const errorText = ec && ec.touched ? ec.error : undefined;
  return (
    <>
      {label}
      {controlStart}
      {children}
      {errorText && <div className={errorClass}>{errorText}</div>}
      {controlEnd}
    </>
  );
}
