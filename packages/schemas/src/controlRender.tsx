import React, {
  CSSProperties,
  FC,
  Fragment,
  Key,
  ReactNode,
  useCallback,
  useEffect,
} from "react";
import {
  addElement,
  Control,
  newControl,
  removeElement,
  useComponentTracking,
  useControl,
  useControlEffect,
} from "@react-typed-forms/core";
import {
  AdornmentPlacement,
  ControlAdornment,
  ControlDefinition,
  DataControlDefinition,
  DisplayData,
  DynamicPropertyType,
  FieldOption,
  GroupRenderOptions,
  isActionControlsDefinition,
  isDataControlDefinition,
  isDisplayControlsDefinition,
  isGroupControlsDefinition,
  RenderOptions,
  SchemaField,
  SchemaInterface,
} from "./types";
import {
  ControlDataContext,
  elementValueForField,
  fieldDisplayName,
  findField,
  isCompoundField,
  useUpdatedRef,
} from "./util";
import { dataControl } from "./controlBuilder";
import {
  defaultUseEvalExpressionHook,
  useEvalAllowedOptionsHook,
  useEvalDefaultValueHook,
  useEvalDisabledHook,
  useEvalDisplayHook,
  UseEvalExpressionHook,
  useEvalReadonlyHook,
  useEvalStyleHook,
  useEvalVisibilityHook,
} from "./hooks";
import { useValidationHook } from "./validators";
import { cc, useCalculatedControl } from "./internal";
import { defaultSchemaInterface } from "./schemaInterface";

export interface FormRenderer {
  renderData: (
    props: DataRendererProps,
  ) => (layout: ControlLayoutProps) => ControlLayoutProps;
  renderGroup: (
    props: GroupRendererProps,
  ) => (layout: ControlLayoutProps) => ControlLayoutProps;
  renderDisplay: (props: DisplayRendererProps) => ReactNode;
  renderAction: (props: ActionRendererProps) => ReactNode;
  renderArray: (props: ArrayRendererProps) => ReactNode;
  renderAdornment: (props: AdornmentProps) => AdornmentRenderer;
  renderLabel: (
    props: LabelRendererProps,
    labelStart: ReactNode,
    labelEnd: ReactNode,
  ) => ReactNode;
  renderLayout: (props: ControlLayoutProps) => RenderedControl;
  renderVisibility: (props: VisibilityRendererProps) => ReactNode;
}

export interface AdornmentProps {
  adornment: ControlAdornment;
}

export const AppendAdornmentPriority = 0;
export const WrapAdornmentPriority = 1000;

export interface AdornmentRenderer {
  apply(children: RenderedLayout): void;
  adornment?: ControlAdornment;
  priority: number;
}

export interface ArrayRendererProps {
  addAction?: ActionRendererProps;
  required: boolean;
  removeAction?: (elemIndex: number) => ActionRendererProps;
  elementCount: number;
  renderElement: (elemIndex: number) => ReactNode;
  elementKey: (elemIndex: number) => Key;
  arrayControl?: Control<any[] | undefined | null>;
  className?: string;
  style?: React.CSSProperties;
}
export interface Visibility {
  visible: boolean;
  showing: boolean;
}

export interface RenderedLayout {
  labelStart?: ReactNode;
  labelEnd?: ReactNode;
  controlStart?: ReactNode;
  controlEnd?: ReactNode;
  label?: ReactNode;
  children?: ReactNode;
  errorControl?: Control<any>;
  className?: string;
  style?: React.CSSProperties;
}

export interface RenderedControl {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  divRef?: (cb: HTMLElement | null) => void;
}

export interface VisibilityRendererProps extends RenderedControl {
  visibility: Control<Visibility | undefined>;
}

export interface ControlLayoutProps {
  label?: LabelRendererProps;
  errorControl?: Control<any>;
  adornments?: AdornmentRenderer[];
  children?: ReactNode;
  processLayout?: (props: ControlLayoutProps) => ControlLayoutProps;
  className?: string | null;
  style?: React.CSSProperties;
}

export enum LabelType {
  Control,
  Group,
}
export interface LabelRendererProps {
  type: LabelType;
  hide?: boolean | null;
  label: ReactNode;
  required?: boolean | null;
  forId?: string;
}
export interface DisplayRendererProps {
  data: DisplayData;
  display?: Control<string | undefined>;
  className?: string;
  style?: React.CSSProperties;
}

export interface GroupRendererProps {
  renderOptions: GroupRenderOptions;
  childCount: number;
  renderChild: (child: number) => ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export interface DataRendererProps {
  renderOptions: RenderOptions;
  field: SchemaField;
  id: string;
  control: Control<any>;
  readonly: boolean;
  required: boolean;
  options: FieldOption[] | undefined | null;
  hidden: boolean;
  className?: string;
  style?: React.CSSProperties;
  dataContext: ControlDataContext;
  childCount: number;
  renderChild: ChildRenderer;
  toArrayProps?: () => ArrayRendererProps;
}

export interface ActionRendererProps {
  actionId: string;
  actionText: string;
  onClick: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export interface ControlRenderProps {
  control: Control<any>;
}

export interface FormContextOptions {
  readonly?: boolean | null;
  hidden?: boolean | null;
  disabled?: boolean | null;
}

export interface DataControlProps {
  definition: DataControlDefinition;
  field: SchemaField;
  dataContext: ControlDataContext;
  control: Control<any>;
  options: FormContextOptions;
  style: React.CSSProperties | undefined;
  childCount: number;
  renderChild: ChildRenderer;
  allowedOptions?: Control<any[] | undefined>;
  elementRenderer?: (elemProps: Control<any>) => ReactNode;
}
export type CreateDataProps = (
  controlProps: DataControlProps,
) => DataRendererProps;

export interface ControlRenderOptions extends FormContextOptions {
  useDataHook?: (c: ControlDefinition) => CreateDataProps;
  useEvalExpressionHook?: UseEvalExpressionHook;
  clearHidden?: boolean;
  schemaInterface?: SchemaInterface;
}
export function useControlRenderer(
  definition: ControlDefinition,
  fields: SchemaField[],
  renderer: FormRenderer,
  options: ControlRenderOptions = {},
): FC<ControlRenderProps> {
  const dataProps = options.useDataHook?.(definition) ?? defaultDataProps;
  const schemaInterface = options.schemaInterface ?? defaultSchemaInterface;
  const useExpr = options.useEvalExpressionHook ?? defaultUseEvalExpressionHook;

  const schemaField = lookupSchemaField(definition, fields);
  const useDefaultValue = useEvalDefaultValueHook(
    useExpr,
    definition,
    schemaField,
  );
  const useIsVisible = useEvalVisibilityHook(useExpr, definition, schemaField);
  const useIsReadonly = useEvalReadonlyHook(useExpr, definition);
  const useIsDisabled = useEvalDisabledHook(useExpr, definition);
  const useAllowedOptions = useEvalAllowedOptionsHook(useExpr, definition);
  const useCustomStyle = useEvalStyleHook(
    useExpr,
    DynamicPropertyType.Style,
    definition,
  );
  const useLayoutStyle = useEvalStyleHook(
    useExpr,
    DynamicPropertyType.LayoutStyle,
    definition,
  );
  const useDynamicDisplay = useEvalDisplayHook(useExpr, definition);
  const useValidation = useValidationHook(definition);
  const r = useUpdatedRef({ options, definition, fields, schemaField });

  const Component = useCallback(
    ({ control: parentControl }: ControlRenderProps) => {
      const stopTracking = useComponentTracking();
      try {
        const { definition: c, options, fields, schemaField } = r.current;
        const dataContext: ControlDataContext = {
          groupControl: parentControl,
          fields,
          schemaInterface,
        };
        const readonlyControl = useIsReadonly(dataContext);
        const disabledControl = useIsDisabled(dataContext);
        const visibleControl = useIsVisible(dataContext);
        const displayControl = useDynamicDisplay(dataContext);
        const customStyle = useCustomStyle(dataContext).value;
        const layoutStyle = useLayoutStyle(dataContext).value;
        const visible = visibleControl.current.value;
        const visibility = useControl<Visibility | undefined>(() =>
          visible != null
            ? {
                visible,
                showing: visible,
              }
            : undefined,
        );
        useControlEffect(
          () => visibleControl.value,
          (visible) => {
            if (visible != null)
              visibility.setValue((ex) => ({
                visible,
                showing: ex ? ex.showing : visible,
              }));
          },
        );

        const allowedOptions = useAllowedOptions(dataContext);
        const defaultValueControl = useDefaultValue(dataContext);
        const [control, childContext] = getControlData(
          schemaField,
          dataContext,
        );
        useControlEffect(
          () => [
            visibility.value,
            defaultValueControl.value,
            control,
            parentControl.isNull,
            isDataControlDefinition(definition) && definition.dontClearHidden,
          ],
          ([vc, dv, cd, pn, dontClear]) => {
            if (pn) {
              parentControl.value = {};
            }
            if (vc && cd && vc.visible === vc.showing) {
              if (!vc.visible) {
                if (options.clearHidden && !dontClear) cd.value = undefined;
              } else if (cd.value == null) {
                cd.value = dv;
              }
            }
          },
          true,
        );
        const myOptions = useCalculatedControl<FormContextOptions>(() => ({
          hidden: options.hidden || !visibility.fields?.showing.value,
          readonly: options.readonly || readonlyControl.value,
          disabled: options.disabled || disabledControl.value,
        })).value;
        useValidation(control!, !!myOptions.hidden, dataContext);
        const childRenderers: FC<ControlRenderProps>[] =
          c.children?.map((cd) =>
            useControlRenderer(cd, childContext.fields, renderer, {
              ...options,
              ...myOptions,
            }),
          ) ?? [];
        useEffect(() => {
          if (control && typeof myOptions.disabled === "boolean")
            control.disabled = myOptions.disabled;
        }, [control, myOptions.disabled]);
        if (parentControl.isNull) return <></>;
        const adornments =
          definition.adornments?.map((x) =>
            renderer.renderAdornment({ adornment: x }),
          ) ?? [];
        const labelAndChildren = renderControlLayout({
          definition: c,
          renderer,
          childCount: childRenderers.length,
          renderChild: (k, i, props) => {
            const RenderChild = childRenderers[i];
            return <RenderChild key={k} {...props} />;
          },
          createDataProps: dataProps,
          formOptions: myOptions,
          dataContext,
          control: displayControl ?? control,
          schemaField,
          displayControl,
          style: customStyle,
          allowedOptions,
        });
        const renderedControl = renderer.renderLayout({
          ...labelAndChildren,
          adornments,
          className: c.layoutClass,
          style: layoutStyle,
        });
        return renderer.renderVisibility({ visibility, ...renderedControl });
      } finally {
        stopTracking();
      }
    },
    [
      r,
      dataProps,
      useIsVisible,
      useDefaultValue,
      useIsReadonly,
      useIsDisabled,
      useCustomStyle,
      useLayoutStyle,
      useAllowedOptions,
      useDynamicDisplay,
      useValidation,
      renderer,
      schemaInterface,
    ],
  );
  (Component as any).displayName = "RenderControl";
  return Component;
}
export function lookupSchemaField(
  c: ControlDefinition,
  fields: SchemaField[],
): SchemaField | undefined {
  const fieldName = isGroupControlsDefinition(c)
    ? c.compoundField
    : isDataControlDefinition(c)
      ? c.field
      : undefined;
  return fieldName ? findField(fields, fieldName) : undefined;
}
export function getControlData(
  schemaField: SchemaField | undefined,
  parentContext: ControlDataContext,
): [Control<any> | undefined, ControlDataContext] {
  const childControl: Control<any> | undefined = schemaField
    ? parentContext.groupControl.fields?.[schemaField.field] ?? newControl({})
    : undefined;
  return [
    childControl,
    schemaField && isCompoundField(schemaField)
      ? {
          groupControl: childControl!,
          fields: schemaField.children,
          schemaInterface: parentContext.schemaInterface,
        }
      : parentContext,
  ];
}

function groupProps(
  renderOptions: GroupRenderOptions = { type: "Standard" },
  childCount: number,
  renderChild: ChildRenderer,
  control: Control<any>,
  className: string | null | undefined,
  style: React.CSSProperties | undefined,
): GroupRendererProps {
  return {
    childCount,
    renderChild: (i) => renderChild(i, i, { control }),
    renderOptions,
    className: cc(className),
    style,
  };
}

export function defaultDataProps({
  definition,
  field,
  control,
  options,
  elementRenderer,
  style,
  allowedOptions,
  ...props
}: DataControlProps): DataRendererProps {
  const className = cc(definition.styleClass);
  const required = !!definition.required;
  const fieldOptions =
    (field.options?.length ?? 0) === 0 ? null : field.options;
  const allowed = allowedOptions?.value ?? [];
  return {
    control,
    field,
    id: "c" + control.uniqueId,
    options:
      fieldOptions && allowed.length > 0
        ? fieldOptions.filter((x) => allowed.includes(x.value))
        : fieldOptions,
    readonly: !!options.readonly,
    renderOptions: definition.renderOptions ?? { type: "Standard" },
    required,
    hidden: !!options.hidden,
    className,
    style,
    ...props,
    toArrayProps: elementRenderer
      ? () =>
          defaultArrayProps(
            control,
            field,
            required,
            style,
            className,
            elementRenderer,
          )
      : undefined,
  };
}

export function defaultArrayProps(
  arrayControl: Control<any[] | undefined | null>,
  field: SchemaField,
  required: boolean,
  style: CSSProperties | undefined,
  className: string | undefined,
  renderElement: (elemProps: Control<any>) => ReactNode,
): ArrayRendererProps {
  const noun = field.displayName ?? field.field;
  const elems = arrayControl.elements ?? [];
  return {
    arrayControl,
    elementCount: elems.length,
    required,
    addAction: {
      actionId: "add",
      actionText: "Add " + noun,
      onClick: () => addElement(arrayControl, elementValueForField(field)),
    },
    elementKey: (i) => elems[i].uniqueId,
    removeAction: (i: number) => ({
      actionId: "",
      actionText: "Remove",
      onClick: () => removeElement(arrayControl, i),
    }),
    renderElement: (i) => renderElement(elems[i]),
    className: cc(className),
    style,
  };
}

export type ChildRenderer = (
  k: Key,
  childIndex: number,
  props: ControlRenderProps,
) => ReactNode;

export interface RenderControlProps {
  definition: ControlDefinition;
  renderer: FormRenderer;
  childCount: number;
  renderChild: ChildRenderer;
  createDataProps: CreateDataProps;
  formOptions: FormContextOptions;
  dataContext: ControlDataContext;
  control?: Control<any>;
  schemaField?: SchemaField;
  displayControl?: Control<string | undefined>;
  style?: React.CSSProperties;
  allowedOptions?: Control<any[] | undefined>;
}
export function renderControlLayout({
  definition: c,
  renderer,
  childCount,
  renderChild: childRenderer,
  control: childControl,
  schemaField,
  dataContext,
  formOptions: dataOptions,
  createDataProps: dataProps,
  displayControl,
  style,
  allowedOptions,
}: RenderControlProps): ControlLayoutProps {
  if (isDataControlDefinition(c)) {
    return renderData(c);
  }
  if (isGroupControlsDefinition(c)) {
    if (c.compoundField) {
      return renderData(
        dataControl(c.compoundField, c.title, {
          children: c.children,
          hideTitle: c.groupOptions?.hideTitle,
        }),
      );
    }
    return {
      processLayout: renderer.renderGroup(
        groupProps(
          c.groupOptions,
          childCount,
          childRenderer,
          dataContext.groupControl,
          c.styleClass,
          style,
        ),
      ),
      label: {
        label: c.title,
        type: LabelType.Group,
        hide: c.groupOptions?.hideTitle,
      },
    };
  }
  if (isActionControlsDefinition(c)) {
    return {
      children: renderer.renderAction({
        actionText: c.title ?? c.actionId,
        actionId: c.actionId,
        onClick: () => {},
        className: cc(c.styleClass),
        style,
      }),
    };
  }
  if (isDisplayControlsDefinition(c)) {
    return {
      children: renderer.renderDisplay({
        data: c.displayData ?? {},
        className: cc(c.styleClass),
        style,
        display: displayControl,
      }),
    };
  }
  return {};

  function renderData(c: DataControlDefinition, elementControl?: Control<any>) {
    if (!schemaField) return { children: "No schema field for: " + c.field };
    const props = dataProps({
      definition: c,
      field: schemaField,
      dataContext,
      control: elementControl ?? childControl!,
      options: dataOptions,
      style,
      childCount,
      allowedOptions,
      renderChild: childRenderer,
      elementRenderer:
        elementControl == null && schemaField.collection
          ? (element) =>
              renderLayoutParts(renderData(c, element), renderer).children
          : undefined,
    });

    const labelText = !c.hideTitle
      ? controlTitle(c.title, schemaField)
      : undefined;
    return {
      processLayout: renderer.renderData(props),
      label: {
        type: LabelType.Control,
        label: labelText,
        forId: props.id,
        required: c.required,
        hide: c.hideTitle,
      },
      errorControl: childControl,
    };
  }

  function compoundRenderer(i: number, control: Control<any>): ReactNode {
    const { className, style, children } = renderer.renderLayout({
      processLayout: renderer.renderGroup({
        renderOptions: { type: "Standard", hideTitle: true },
        childCount,
        renderChild: (ci) => childRenderer(ci, ci, { control }),
      }),
    });
    return (
      <div key={control.uniqueId} style={style} className={cc(className)}>
        {children}
      </div>
    );
  }
  function scalarRenderer(
    dataProps: DataRendererProps,
  ): (i: number, control: Control<any>) => ReactNode {
    return (i, control) => {
      return (
        <Fragment key={control.uniqueId}>
          {renderer.renderData({ ...dataProps, control })({}).children}
        </Fragment>
      );
    };
  }
}

export function appendMarkup(
  k: keyof Omit<RenderedLayout, "errorControl" | "style" | "className">,
  markup: ReactNode,
): (layout: RenderedLayout) => void {
  return (layout) =>
    (layout[k] = (
      <>
        {layout[k]}
        {markup}
      </>
    ));
}

export function wrapMarkup(
  k: keyof Omit<RenderedLayout, "errorControl" | "style" | "className">,
  wrap: (ex: ReactNode) => ReactNode,
): (layout: RenderedLayout) => void {
  return (layout) => (layout[k] = wrap(layout[k]));
}

export function layoutKeyForPlacement(
  pos: AdornmentPlacement,
): keyof Omit<RenderedLayout, "errorControl" | "style" | "className"> {
  switch (pos) {
    case AdornmentPlacement.ControlEnd:
      return "controlEnd";
    case AdornmentPlacement.ControlStart:
      return "controlStart";
    case AdornmentPlacement.LabelStart:
      return "labelStart";
    case AdornmentPlacement.LabelEnd:
      return "labelEnd";
  }
}

export function appendMarkupAt(
  pos: AdornmentPlacement,
  markup: ReactNode,
): (layout: RenderedLayout) => void {
  return appendMarkup(layoutKeyForPlacement(pos), markup);
}

export function wrapMarkupAt(
  pos: AdornmentPlacement,
  wrap: (ex: ReactNode) => ReactNode,
): (layout: RenderedLayout) => void {
  return wrapMarkup(layoutKeyForPlacement(pos), wrap);
}

export function renderLayoutParts(
  props: ControlLayoutProps,
  renderer: FormRenderer,
): RenderedLayout {
  const { className, children, style, errorControl, label, adornments } =
    props.processLayout?.(props) ?? props;
  const layout: RenderedLayout = {
    children,
    errorControl,
    style,
    className: cc(className),
  };
  (adornments ?? [])
    .sort((a, b) => a.priority - b.priority)
    .forEach((x) => x.apply(layout));
  layout.label =
    label && !label.hide
      ? renderer.renderLabel(label, layout.labelStart, layout.labelEnd)
      : undefined;
  return layout;
}

export function controlTitle(
  title: string | undefined | null,
  field: SchemaField,
) {
  return title ? title : fieldDisplayName(field);
}
