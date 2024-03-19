import React, {
  FC,
  Fragment,
  Key,
  MutableRefObject,
  ReactNode,
  RefObject,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  addElement,
  Control,
  removeElement,
  useComponentTracking,
  useComputed,
  useControl,
  useControlEffect,
} from "@react-typed-forms/core";
import jsonata from "jsonata";
import {
  AdornmentPlacement,
  ControlAdornment,
  ControlDefinition,
  DataControlDefinition,
  DisplayData,
  DynamicPropertyType,
  EntityExpression,
  ExpressionType,
  FieldOption,
  FieldType,
  FieldValueExpression,
  GroupRenderOptions,
  isActionControlsDefinition,
  isDataControlDefinition,
  isDisplayControlsDefinition,
  isGroupControlsDefinition,
  JsonataExpression,
  RenderOptions,
  SchemaField,
} from "./types";
import {
  elementValueForField,
  fieldDisplayName,
  findField,
  isCompoundField,
} from "./util";
import { dataControl } from "./controlBuilder";

export interface FormRenderer {
  renderData: (
    props: DataRendererProps,
    asArray: (() => ReactNode) | undefined,
  ) => (layout: ControlLayoutProps) => ControlLayoutProps;
  renderGroup: (props: GroupRendererProps) => ReactNode;
  renderDisplay: (props: DisplayRendererProps) => ReactNode;
  renderAction: (props: ActionRendererProps) => ReactNode;
  renderArray: (props: ArrayRendererProps) => ReactNode;
  renderAdornment: (props: AdornmentProps) => AdornmentRenderer;
  renderLabel: (
    props: LabelRendererProps,
    labelStart: ReactNode,
    labelEnd: ReactNode,
  ) => ReactNode;
  renderLayout: (props: ControlLayoutProps) => ReactNode;
  renderVisibility: (
    control: Control<Visibility | undefined>,
    children: () => ReactNode,
  ) => ReactNode;
}

export interface DisplayRendererProps {
  data: DisplayData;
}
export interface AdornmentProps {
  key: Key;
  adornment: ControlAdornment;
}

export interface AdornmentRenderer {
  wrap?: (children: ReactNode) => ReactNode;
  child?: ReactNode;
  placement?: AdornmentPlacement;
}

export interface ArrayRendererProps {
  addAction?: ActionRendererProps;
  removeAction?: (childIndex: number) => ActionRendererProps;
  childCount: number;
  renderChild: (childIndex: number) => ReactNode;
  childKey: (childIndex: number) => Key;
}
export interface Visibility {
  visible: boolean;
  showing: boolean;
}

export interface ControlLayoutProps {
  labelStart?: ReactNode;
  label?: LabelRendererProps;
  renderedLabel?: ReactNode;
  labelEnd?: ReactNode;
  controlStart?: ReactNode;
  children?: ReactNode;
  controlEnd?: ReactNode;
  errorControl?: Control<any>;
  processLayout?: (props: ControlLayoutProps) => ControlLayoutProps;
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
}

export interface ActionRendererProps {
  actionId: string;
  actionText: string;
  onClick: () => void;
}

export interface ControlRenderProps {
  control: Control<any>;
}

export interface CreateDataOptions {
  readonly?: boolean | null;
}

export interface ControlGroupContext {
  groupControl: Control<any>;
  fields: SchemaField[];
}

export type CreateDataProps = (
  definition: DataControlDefinition,
  field: SchemaField,
  groupContext: ControlGroupContext,
  control: Control<any>,
  options: CreateDataOptions,
) => DataRendererProps;
export interface ControlRenderOptions extends CreateDataOptions {
  useDataHook?: (c: ControlDefinition) => CreateDataProps;
}

export function useControlRenderer(
  definition: ControlDefinition,
  fields: SchemaField[],
  renderer: FormRenderer,
  options: ControlRenderOptions = {},
): FC<ControlRenderProps> {
  const dataProps = options.useDataHook?.(definition) ?? defaultDataProps;
  const schemaField = lookupSchemaField(definition, fields);
  const useDefaultValue = useEvalDefaultValueHook(definition, schemaField);
  const useIsVisible = useEvalVisibilityHook(definition, schemaField);
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
        const visibleControl = useIsVisible(groupContext);
        const visible = visibleControl.current.value;
        const visibility = useControl<Visibility | undefined>(
          visible != null
            ? {
                visible,
                showing: false,
              }
            : undefined,
        );
        useControlEffect(
          () => visibleControl.value,
          (visible) => {
            if (visible != null)
              visibility.setValue((ex) => ({
                visible,
                showing: ex?.showing ?? false,
              }));
          },
        );

        const defaultValueControl = useDefaultValue(groupContext);
        const [control, childContext] = getControlData(
          schemaField,
          groupContext,
        );
        useControlEffect(
          () => [visibility.value, defaultValueControl.value, control],
          ([vc, dv, cd]) => {
            if (vc && cd && vc.visible === vc.showing) {
              if (!vc.visible) {
                cd.value = undefined;
              } else if (cd.value == null) {
                cd.value = dv;
              }
            }
          },
          true,
        );
        const childRenderers: FC<ControlRenderProps>[] =
          c.children?.map((cd) =>
            useControlRenderer(cd, childContext.fields, renderer, options),
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
          options,
          groupContext,
          control,
          schemaField,
        );
        return renderer.renderVisibility(visibility, () =>
          renderer.renderLayout(labelAndChildren),
        );
      } finally {
        stopTracking();
      }
    },
    [r, dataProps, useIsVisible, useDefaultValue, renderer],
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
    ? parentContext.groupControl.fields[schemaField.field]
    : undefined;
  return [
    childControl,
    schemaField && isCompoundField(schemaField)
      ? { groupControl: childControl!, fields: schemaField.children }
      : parentContext,
  ];
}

function renderArray(
  renderer: FormRenderer,
  noun: string,
  field: SchemaField,
  controlArray: Control<any[] | undefined | null>,
  renderChild: (elemIndex: number, control: Control<any>) => ReactNode,
) {
  const elems = controlArray.elements ?? [];
  return renderer.renderArray({
    childCount: elems.length,
    addAction: {
      actionId: "add",
      actionText: "Add " + noun,
      onClick: () => addElement(controlArray, elementValueForField(field)),
    },
    childKey: (i) => elems[i].uniqueId,
    removeAction: (i: number) => ({
      actionId: "",
      actionText: "Remove",
      onClick: () => removeElement(controlArray, i),
    }),
    renderChild: (i) => renderChild(i, elems[i]),
  });
}
function groupProps(
  renderOptions: GroupRenderOptions,
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
    readonly: options.readonly || !!definition.readonly,
    renderOptions: definition.renderOptions ?? { type: "Standard" },
    required: !!definition.required,
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
  dataOptions: CreateDataOptions,
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
          hideTitle: c.groupOptions.hideTitle,
        }),
      );
    }
    return {
      children: renderer.renderGroup(
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
        hide: c.groupOptions.hideTitle,
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
    return { children: renderer.renderDisplay({ data: c.displayData }) };
  }
  return {};

  function renderData(c: DataControlDefinition) {
    const field: SchemaField = schemaField ?? {
      field: c.field,
      type: FieldType.String,
    };
    if (isCompoundField(field)) {
      const label: LabelRendererProps = {
        hide: c.hideTitle,
        label: controlTitle(c.title, field),
        type: field.collection ? LabelType.Control : LabelType.Group,
      };

      if (field.collection) {
        return {
          label,
          children: renderArray(
            renderer,
            controlTitle(c.title, field),
            field,
            childControl!,
            compoundRenderer,
          ),
          errorControl: childControl,
        };
      }
      return {
        children: renderer.renderGroup(
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
    const props = dataProps(c, field, groupContext, childControl!, dataOptions);
    const labelText = !c.hideTitle ? controlTitle(c.title, field) : undefined;
    return {
      processLayout: renderer.renderData(
        props,
        field.collection
          ? () =>
              renderArray(
                renderer,
                controlTitle(c.title, field),
                field,
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
    return (
      <Fragment key={control.uniqueId}>
        {renderer.renderGroup({
          renderOptions: { type: "Standard", hideTitle: true },
          childCount: childRenderer.length,
          renderChild: (ci) => childRenderer(ci, ci, { control }),
        })}
      </Fragment>
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

function useJsonataExpression(
  jExpr: JsonataExpression,
  data: Control<any>,
): Control<any> {
  const compiledExpr = useMemo(
    () => jsonata(jExpr.expression),
    [jExpr.expression],
  );
  const control = useControl();
  useControlEffect(
    () => data.value,
    async (v) => {
      control.value = await compiledExpr.evaluate(v);
    },
    true,
  );
  return control;
}

export type EvalExpressionHook<A = any> = (
  groupContext: ControlGroupContext,
) => Control<A | undefined>;

function useFieldValueExpression(
  fvExpr: FieldValueExpression,
  fields: SchemaField[],
  data: Control<any>,
) {
  const refField = findField(fields, fvExpr.field);
  const otherField = refField ? data.fields[refField.field] : undefined;
  return useComputed(() => {
    const fv = otherField?.value;
    return Array.isArray(fv) ? fv.includes(fvExpr.value) : fv === fvExpr.value;
  });
}
function useEvalExpressionHook(
  expr: EntityExpression | undefined,
): EvalExpressionHook | undefined {
  const r = useUpdatedRef(expr);
  const cb = useCallback(
    ({ groupControl, fields }: ControlGroupContext) => {
      const expr = r.current!;
      switch (expr.type) {
        case ExpressionType.Jsonata:
          return useJsonataExpression(expr as JsonataExpression, groupControl);
        case ExpressionType.FieldValue:
          return useFieldValueExpression(
            expr as FieldValueExpression,
            fields,
            groupControl,
          );
        default:
          return useControl(undefined);
      }
    },
    [expr?.type, r],
  );
  return expr ? cb : undefined;
}

export function useEvalDynamicHook(
  definition: ControlDefinition,
  type: DynamicPropertyType,
): EvalExpressionHook | undefined {
  const expression = definition.dynamic?.find((x) => x.type === type);
  return useEvalExpressionHook(expression?.expr);
}

export function matchesType(
  context: ControlGroupContext,
  types?: string[] | null,
) {
  if (types == null || types.length === 0) return true;
  const typeField = getTypeField(context);
  return types.includes(typeField!.value);
}

export function useEvalVisibilityHook(
  definition: ControlDefinition,
  schemaField?: SchemaField,
): EvalExpressionHook<boolean> {
  const dynamicVisibility = useEvalDynamicHook(
    definition,
    DynamicPropertyType.Visible,
  );
  const r = useUpdatedRef(schemaField);
  return useCallback(
    (ctx) => {
      const schemaField = r.current;
      return (
        dynamicVisibility?.(ctx) ??
        useComputed(() => matchesType(ctx, schemaField?.onlyForTypes))
      );
    },
    [dynamicVisibility, r],
  );
}

export function getTypeField(
  context: ControlGroupContext,
): Control<string> | undefined {
  const typeSchemaField = context.fields.find((x) => x.isTypeField);
  return typeSchemaField
    ? context.groupControl.fields[typeSchemaField.field]
    : undefined;
}

export function useEvalDefaultValueHook(
  definition: ControlDefinition,
  schemaField?: SchemaField,
): EvalExpressionHook {
  const dynamicValue = useEvalDynamicHook(
    definition,
    DynamicPropertyType.DefaultValue,
  );
  const r = useUpdatedRef({ definition, schemaField });
  return useCallback(
    (ctx) => {
      const { definition, schemaField } = r.current;
      return (
        dynamicValue?.(ctx) ??
        useControl(
          (isDataControlDefinition(definition)
            ? definition.defaultValue
            : undefined) ?? schemaField?.defaultValue,
        )
      );
    },
    [dynamicValue, r],
  );
}

export function controlTitle(
  title: string | undefined | null,
  field: SchemaField,
) {
  return title ? title : fieldDisplayName(field);
}

function useUpdatedRef<A>(a: A): MutableRefObject<A> {
  const r = useRef(a);
  r.current = a;
  return r;
}
