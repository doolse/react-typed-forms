import React, {
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
  FieldOption,
  GroupRenderOptions,
  isActionControlsDefinition,
  isDataControlDefinition,
  isDisplayControlsDefinition,
  isGroupControlsDefinition,
  RenderOptions,
  SchemaField,
} from "./types";
import {
  ControlGroupContext,
  elementValueForField,
  fieldDisplayName,
  findField,
  isCompoundField,
  useUpdatedRef,
} from "./util";
import { dataControl } from "./controlBuilder";
import {
  defaultUseEvalExpressionHook,
  useEvalDefaultValueHook,
  useEvalDisabledHook,
  UseEvalExpressionHook,
  useEvalReadonlyHook,
  useEvalVisibilityHook,
} from "./hooks";
import { useValidationHook } from "./validators";
import { useCalculatedControl } from "./internal";
import clsx from "clsx";

export interface FormRenderer {
  renderData: (
    props: DataRendererProps,
    asArray: (() => ReactNode) | undefined,
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
  removeAction?: (childIndex: number) => ActionRendererProps;
  childCount: number;
  renderChild: (childIndex: number) => ReactNode;
  childKey: (childIndex: number) => Key;
  arrayControl?: Control<any[] | undefined | null>;
  styleClass?: string | null;
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
  className?: string | null;
  style?: React.CSSProperties;
}

export interface RenderedControl {
  children: ReactNode;
  className?: string | null;
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
}

export interface GroupRendererProps {
  renderOptions: GroupRenderOptions;
  childCount: number;
  renderChild: (child: number) => ReactNode;
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
}

export interface ActionRendererProps {
  actionId: string;
  actionText: string;
  onClick: () => void;
}

export interface ControlRenderProps {
  control: Control<any>;
}

export interface FormContextOptions {
  readonly?: boolean | null;
  hidden?: boolean | null;
  disabled?: boolean | null;
}

export type CreateDataProps = (
  definition: DataControlDefinition,
  field: SchemaField,
  groupContext: ControlGroupContext,
  control: Control<any>,
  options: FormContextOptions,
) => DataRendererProps;
export interface ControlRenderOptions extends FormContextOptions {
  useDataHook?: (c: ControlDefinition) => CreateDataProps;
  useEvalExpressionHook?: UseEvalExpressionHook;
  clearHidden?: boolean;
}
export function useControlRenderer(
  definition: ControlDefinition,
  fields: SchemaField[],
  renderer: FormRenderer,
  options: ControlRenderOptions = {},
): FC<ControlRenderProps> {
  const dataProps = options.useDataHook?.(definition) ?? defaultDataProps;
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
  const useValidation = useValidationHook(definition);
  const r = useUpdatedRef({ options, definition, fields, schemaField });

  const Component = useCallback(
    ({ control: parentControl }: ControlRenderProps) => {
      const stopTracking = useComponentTracking();
      try {
        const { definition: c, options, fields, schemaField } = r.current;
        const groupContext: ControlGroupContext = {
          groupControl: parentControl,
          fields,
        };
        const readonlyControl = useIsReadonly(groupContext);
        const disabledControl = useIsDisabled(groupContext);
        const visibleControl = useIsVisible(groupContext);
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

        const defaultValueControl = useDefaultValue(groupContext);
        const [control, childContext] = getControlData(
          schemaField,
          groupContext,
        );
        useControlEffect(
          () => [
            visibility.value,
            defaultValueControl.value,
            control,
            parentControl.isNull,
          ],
          ([vc, dv, cd, pn]) => {
            if (pn) {
              parentControl.value = {};
            }
            if (vc && cd && vc.visible === vc.showing) {
              if (!vc.visible) {
                if (options.clearHidden) cd.value = undefined;
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
        useValidation(control!, !!myOptions.hidden, groupContext);
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
        const labelAndChildren = renderControlLayout(
          c,
          renderer,
          childRenderers.length,
          (k, i, props) => {
            const RenderChild = childRenderers[i];
            return <RenderChild key={k} {...props} />;
          },
          dataProps,
          myOptions,
          groupContext,
          control,
          schemaField,
        );
        const renderedControl = renderer.renderLayout({
          ...labelAndChildren,
          adornments,
          className: c.styleClass,
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
      useValidation,
      renderer,
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
  parentContext: ControlGroupContext,
): [Control<any> | undefined, ControlGroupContext] {
  const childControl: Control<any> | undefined = schemaField
    ? parentContext.groupControl.fields?.[schemaField.field] ?? newControl({})
    : undefined;
  return [
    childControl,
    schemaField && isCompoundField(schemaField)
      ? {
          groupControl: childControl!,
          fields: schemaField.children,
        }
      : parentContext,
  ];
}

function renderArray(
  renderer: FormRenderer,
  noun: string,
  field: SchemaField,
  required: boolean,
  arrayControl: Control<any[] | undefined | null>,
  renderChild: (elemIndex: number, control: Control<any>) => ReactNode,
) {
  const elems = arrayControl.elements ?? [];
  return renderer.renderArray({
    arrayControl,
    childCount: elems.length,
    required,
    addAction: {
      actionId: "add",
      actionText: "Add " + noun,
      onClick: () => addElement(arrayControl, elementValueForField(field)),
    },
    childKey: (i) => elems[i].uniqueId,
    removeAction: (i: number) => ({
      actionId: "",
      actionText: "Remove",
      onClick: () => removeElement(arrayControl, i),
    }),
    renderChild: (i) => renderChild(i, elems[i]),
  });
}
function groupProps(
  renderOptions: GroupRenderOptions = { type: "Standard" },
  childCount: number,
  renderChild: ChildRenderer,
  control: Control<any>,
): GroupRendererProps {
  return {
    childCount,
    renderChild: (i) => renderChild(i, i, { control }),
    renderOptions,
  };
}

export const defaultDataProps: CreateDataProps = (
  definition,
  field,
  groupContext,
  control,
  options,
) => {
  return {
    control,
    field,
    id: "c" + control.uniqueId,
    options: (field.options?.length ?? 0) === 0 ? null : field.options,
    readonly: !!options.readonly,
    renderOptions: definition.renderOptions ?? { type: "Standard" },
    required: !!definition.required,
    hidden: !!options.hidden,
    styleClass: definition.styleClass,
  };
};

export type ChildRenderer = (
  k: Key,
  childIndex: number,
  props: ControlRenderProps,
) => ReactNode;
export function renderControlLayout(
  c: ControlDefinition,
  renderer: FormRenderer,
  childCount: number,
  childRenderer: ChildRenderer,
  dataProps: CreateDataProps,
  dataOptions: FormContextOptions,
  groupContext: ControlGroupContext,
  childControl?: Control<any>,
  schemaField?: SchemaField,
): ControlLayoutProps {
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
          groupContext.groupControl,
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
      }),
    };
  }
  if (isDisplayControlsDefinition(c)) {
    return {
      children: renderer.renderDisplay({
        data: c.displayData ?? {},
      }),
    };
  }
  return {};

  function renderData(c: DataControlDefinition) {
    if (!schemaField) return { children: "No schema field for: " + c.field };
    if (isCompoundField(schemaField)) {
      const label: LabelRendererProps = {
        hide: c.hideTitle,
        label: controlTitle(c.title, schemaField),
        type: schemaField.collection ? LabelType.Control : LabelType.Group,
      };

      if (schemaField.collection) {
        return {
          label,
          children: renderArray(
            renderer,
            controlTitle(c.title, schemaField),
            schemaField,
            !!c.required,
            childControl!,
            compoundRenderer,
          ),
          errorControl: childControl,
        };
      }
      return {
        processLayout: renderer.renderGroup(
          groupProps(
            { type: "Standard" },
            childCount,
            childRenderer,
            childControl!,
          ),
        ),
        label,
        errorControl: childControl,
      };
    }
    const props = dataProps(
      c,
      schemaField,
      groupContext,
      childControl!,
      dataOptions,
    );
    const labelText = !c.hideTitle
      ? controlTitle(c.title, schemaField)
      : undefined;
    return {
      processLayout: renderer.renderData(
        props,
        schemaField.collection
          ? () =>
              renderArray(
                renderer,
                controlTitle(c.title, schemaField),
                schemaField,
                !!c.required,
                childControl!,
                scalarRenderer(props),
              )
          : undefined,
      ),
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
      <div key={control.uniqueId} style={style} className={clsx(className)}>
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
          {
            renderer.renderData({ ...dataProps, control }, undefined)({})
              .children
          }
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
    className,
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
