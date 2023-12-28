import React, {
  CSSProperties,
  Fragment,
  ReactElement,
  ReactNode,
  useMemo,
  useState,
} from "react";
import {
  ActionRendererProps,
  AdornmentProps,
  AdornmentRenderer,
  ArrayRendererProps,
  controlTitle,
  DataRendererProps,
  DisplayRendererProps,
  FormRenderer,
  GroupRendererProps,
  LabelRendererProps,
  Visibility,
} from "./controlRender";
import clsx from "clsx";
import {
  AdornmentPlacement,
  ControlDefinition,
  DataRenderType,
  DisplayDataType,
  FieldOption,
  FieldType,
  GridRenderer,
  HtmlDisplay,
  isGridRenderer,
  TextDisplay,
} from "./types";
import { Control, Fcheckbox, formControlProps } from "@react-typed-forms/core";
import { hasOptions } from "./util";

export interface DefaultRenderers {
  data: DataRendererRegistration;
  label: LabelRendererRegistration;
  action: ActionRendererRegistration;
  array: ArrayRendererRegistration;
  group: GroupRendererRegistration;
  display: DisplayRendererRegistration;
  visibility: VisibilityRendererRegistration;
  adornment: AdornmentRendererRegistration;
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
    defaultLabel: (label?: Partial<LabelRendererProps>) => LabelRendererProps,
    renderers: FormRenderer,
  ) => ReactElement;
}

export interface LabelRendererRegistration {
  type: "label";
  render: (
    labelProps: LabelRendererProps,
    elem: ReactElement,
    renderers: FormRenderer,
  ) => ReactElement;
}

export interface ActionRendererRegistration {
  type: "action";
  render: (props: ActionRendererProps, renderers: FormRenderer) => ReactElement;
}

export interface ArrayRendererRegistration {
  type: "array";
  render: (props: ArrayRendererProps, renderers: FormRenderer) => ReactElement;
}

export interface GroupRendererRegistration {
  type: "group";
  render: (
    props: GroupRendererProps,
    defaultLabel: (label?: Partial<LabelRendererProps>) => LabelRendererProps,
    renderers: FormRenderer,
  ) => ReactElement;
}

export interface DisplayRendererRegistration {
  type: "display";
  render: (
    props: DisplayRendererProps,
    renderers: FormRenderer,
  ) => ReactElement;
}

export interface VisibilityRendererRegistration {
  type: "visibility";
  render: (visible: Visibility, elem: ReactElement) => ReactElement;
}

export interface AdornmentRendererRegistration {
  type: "adornment";
  adornmentType?: string | string[];
  render: (props: AdornmentProps) => AdornmentRenderer;
}

export type AnyRendererRegistration =
  | DataRendererRegistration
  | GroupRendererRegistration
  | DisplayRendererRegistration
  | ActionRendererRegistration
  | LabelRendererRegistration
  | ArrayRendererRegistration
  | AdornmentRendererRegistration
  | VisibilityRendererRegistration;

export function createFormRenderer(
  customRenderers: AnyRendererRegistration[] = [],
  defaultRenderers: DefaultRenderers = createClassStyledRenderers(),
): FormRenderer {
  const dataRegistrations = customRenderers.filter(isDataRegistration);
  const adornmentRegistrations = customRenderers.filter(
    isAdornmentRegistration,
  );
  const labelRenderer =
    customRenderers.find(isLabelRegistration) ?? defaultRenderers.label;
  const renderVisibility = (
    customRenderers.find(isVisibilityRegistration) ??
    defaultRenderers.visibility
  ).render;

  const formRenderers = {
    renderAction,
    renderData,
    renderGroup,
    renderDisplay,
    renderLabel,
    renderArray,
    renderVisibility,
    renderAdornment,
  };

  function renderAdornment(props: AdornmentProps): AdornmentRenderer {
    const renderer =
      adornmentRegistrations.find((x) =>
        isOneOf(x.adornmentType, props.definition.type),
      ) ?? defaultRenderers.adornment;
    return renderer.render(props);
  }

  function renderArray(props: ArrayRendererProps) {
    return defaultRenderers.array.render(props, formRenderers);
  }

  function renderLabel(props: LabelRendererProps, elem: ReactElement) {
    return labelRenderer.render(props, elem, formRenderers);
  }

  function withAdornments(
    definition: ControlDefinition,
    adornments?: AdornmentRenderer[],
  ): [
    AdornmentRenderer[],
    (placement: AdornmentPlacement) => ReactElement,
    (elem: ReactElement) => ReactElement,
  ] {
    const rAdornments = adornments
      ? adornments
      : definition.adornments?.map((x, i) =>
          renderAdornment({ definition: x, key: i }),
        ) ?? [];
    function combineAdornments(placement: AdornmentPlacement) {
      return (
        <>
          {rAdornments
            .filter((x) => x.child && x.child[0] === placement)
            .map((x) => x.child![1])}
        </>
      );
    }
    return [
      rAdornments,
      combineAdornments,
      (mainElem) =>
        !adornments
          ? mainElem
          : rAdornments.reduce((e, n) => n.wrap?.(e) ?? e, mainElem),
    ];
  }

  function renderData(
    props: DataRendererProps,
    adornments?: AdornmentRenderer[],
  ): ReactElement {
    const {
      definition,
      renderOptions: { type: renderType },
      visible,
      required,
      control,
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

    const [rAdornments, renderAdornment, wrapElem] = withAdornments(
      definition,
      adornments,
    );
    return wrapElem(
      renderer.render(props, createLabel, {
        ...formRenderers,
        renderData: (p) => renderData(p, rAdornments),
      }),
    );

    function createLabel(labelProps?: Partial<LabelRendererProps>) {
      return {
        visible,
        required,
        control,
        forId: "c" + control.uniqueId,
        renderAdornment,
        ...labelProps,
        title: labelProps?.title ?? controlTitle(definition.title, field),
      };
    }
  }

  function renderGroup(
    props: GroupRendererProps,
    adornments?: AdornmentRenderer[],
  ): ReactElement {
    const { definition, visible, field } = props;

    const [rAdornments, renderAdornment, wrapElem] = withAdornments(
      props.definition,
      adornments,
    );

    const title = props.hideTitle
      ? undefined
      : field
      ? controlTitle(definition.title, field)
      : definition.title;

    return wrapElem(
      defaultRenderers.group.render(props, createLabel, {
        ...formRenderers,
        renderGroup: (p) => renderGroup(p, rAdornments),
      }),
    );

    function createLabel(
      labelProps?: Partial<LabelRendererProps>,
    ): LabelRendererProps {
      return {
        required: false,
        visible,
        group: true,
        renderAdornment,
        title,
        ...labelProps,
      };
    }
  }

  function renderAction(
    props: ActionRendererProps,
    adornments?: AdornmentRenderer[],
  ) {
    const renderer =
      customRenderers.find(isActionRegistration) ?? defaultRenderers.action;
    const [rAdornments, renderAdornment, wrapElem] = withAdornments(
      props.definition,
      adornments,
    );
    return wrapElem(renderer.render(props, formRenderers));
  }

  function renderDisplay(
    props: DisplayRendererProps,
    adornments?: AdornmentRenderer[],
  ) {
    const [rAdornments, renderAdornment, wrapElem] = withAdornments(
      props.definition,
      adornments,
    );
    return wrapElem(defaultRenderers.display.render(props, formRenderers));
  }

  return formRenderers;
}

interface DefaultLabelRendererOptions {
  className?: string;
  groupLabelClass?: string;
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
    { renderVisibility }: Pick<FormRenderer, "renderVisibility">,
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
    render: (p, elem, { renderVisibility }) =>
      renderVisibility(
        p.visible,
        <DefaultLabelRenderer {...p} {...options} children={elem} />,
      ),
    type: "label",
  };
}

export function DefaultLabelRenderer({
  className,
  labelClass,
  title,
  forId,
  required,
  children,
  group,
  groupLabelClass,
  renderAdornment,
  requiredElement,
}: LabelRendererProps &
  DefaultLabelRendererOptions & { children: ReactElement }) {
  return title ? (
    <div className={className}>
      {renderAdornment(AdornmentPlacement.LabelStart)}
      <label
        htmlFor={forId}
        className={clsx(labelClass, group && groupLabelClass)}
      >
        {title}
        {required && requiredElement}
      </label>
      {renderAdornment(AdornmentPlacement.LabelEnd)}
      {renderAdornment(AdornmentPlacement.ControlStart)}
      {children}
      {renderAdornment(AdornmentPlacement.ControlEnd)}
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
    { renderAction }: Pick<FormRenderer, "renderAction">,
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
    defaultLabel: (label?: Partial<LabelRendererProps>) => LabelRendererProps,
    {
      renderLabel,
      renderArray,
    }: Pick<FormRenderer, "renderLabel" | "renderArray" | "renderGroup">,
  ) {
    const { childCount, renderChild, definition } = props;

    return renderLabel(
      defaultLabel(),
      props.array ? renderArray(props.array) : renderChildren(),
    );

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

export const DefaultBoolOptions: FieldOption[] = [
  { name: "Yes", value: true },
  { name: "No", value: false },
];
interface DefaultDataRendererOptions {
  inputClass?: string;
  selectOptions?: SelectRendererOptions;
  booleanOptions?: FieldOption[];
  optionRenderer?: DataRendererRegistration;
}

export function createDefaultDataRenderer(
  options: DefaultDataRendererOptions = {},
): DataRendererRegistration {
  const selectRenderer = createSelectRenderer(options.selectOptions ?? {});
  const { inputClass, booleanOptions, optionRenderer } = {
    optionRenderer: selectRenderer,
    booleanOptions: DefaultBoolOptions,
    ...options,
  };
  return createDataRenderer((props, defaultLabel, renderers) => {
    if (props.array) {
      return renderers.renderArray(props.array);
    }
    let renderType = props.renderOptions.type;
    const fieldType = props.field.type;
    const isBool = fieldType === FieldType.Bool;
    if (booleanOptions != null && isBool && props.options == null) {
      return renderers.renderData({ ...props, options: booleanOptions });
    }
    if (renderType === DataRenderType.Standard && hasOptions(props)) {
      return optionRenderer.render(props, defaultLabel, renderers);
    }
    switch (renderType) {
      case DataRenderType.Dropdown:
        return selectRenderer.render(props, defaultLabel, renderers);
    }
    const l = defaultLabel();
    return renderers.renderLabel(
      l,
      renderType === DataRenderType.Checkbox ? (
        <Fcheckbox control={props.control} />
      ) : (
        <ControlInput
          className={inputClass}
          id={l.forId}
          readOnly={props.readonly}
          control={props.control}
          convert={createInputConversion(props.field.type)}
        />
      ),
    );
  });
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

export interface DefaultVisibilityRendererOptions {}

export interface DefaultAdornmentRendererOptions {}

export function createDefaultAdornmentRenderer(
  options: DefaultAdornmentRendererOptions = {},
): AdornmentRendererRegistration {
  return { type: "adornment", render: () => ({}) };
}
export function createDefaultVisibilityRenderer(
  options: DefaultVisibilityRendererOptions = {},
): VisibilityRendererRegistration {
  return {
    type: "visibility",
    render: (visible, children) => (visible.value ? children : <></>),
  };
}

export interface DefaultRendererOptions {
  data?: DefaultDataRendererOptions;
  display?: DefaultDisplayRendererOptions;
  action?: DefaultActionRendererOptions;
  array?: DefaultArrayRendererOptions;
  group?: DefaultGroupRendererOptions;
  label?: DefaultLabelRendererOptions;
  visibility?: DefaultVisibilityRendererOptions;
  adornment?: DefaultAdornmentRendererOptions;
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
    adornment: createDefaultAdornmentRenderer(options.adornment),
  };
}

function createClassStyledRenderers() {
  return createDefaultRenderers({
    label: { className: "control" },
    group: { className: "group" },
    array: { className: "control-array" },
    action: { className: "action" },
    data: { inputClass: "data" },
    display: { htmlClassName: "html", textClassName: "text" },
  });
}

function isAdornmentRegistration(
  x: AnyRendererRegistration,
): x is AdornmentRendererRegistration {
  return x.type === "adornment";
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

export function createDataRenderer(
  render: DataRendererRegistration["render"],
  options?: Partial<DataRendererRegistration>,
): DataRendererRegistration {
  return { type: "data", render, ...options };
}

export function createDataRendererLabelled(
  render: (
    props: DataRendererProps,
    id: string,
    renderers: FormRenderer,
  ) => ReactElement,
  options?: Partial<DataRendererRegistration>,
): DataRendererRegistration {
  return {
    type: "data",
    render: (props, defaultLabel, renderers) => {
      const dl = defaultLabel();
      return renderers.renderLabel(dl, render(props, dl.forId!, renderers));
    },
    ...options,
  };
}

export function createLabelRenderer(
  options: Omit<LabelRendererRegistration, "type">,
): LabelRendererRegistration {
  return { type: "label", ...options };
}

export function createAdornmentRenderer(
  render: (props: AdornmentProps) => AdornmentRenderer,
  options?: Omit<AdornmentRendererRegistration, "type">,
): AdornmentRendererRegistration {
  return { type: "adornment", ...options, render };
}

export interface SelectRendererOptions {
  className?: string;
  emptyText?: string;
  requiredText?: string;
}

export function createSelectRenderer(options: SelectRendererOptions = {}) {
  return createDataRendererLabelled(
    (props, id) => (
      <SelectDataRenderer
        className={options.className}
        state={props.control}
        id={id}
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
