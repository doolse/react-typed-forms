import React, {
  FC,
  Fragment,
  Key,
  ReactNode,
  useCallback,
  useMemo,
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
  renderLabel: (props: LabelRendererProps) => ReactNode;
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
  label?: ReactNode;
  labelText?: ReactNode;
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

export function useControlRenderer(
  c: ControlDefinition,
  fields: SchemaField[],
  renderer: FormRenderer,
): FC<ControlRenderProps> {
  const Component = useCallback(
    ({ control }: ControlRenderProps) => {
      const stopTracking = useComponentTracking();
      try {
        const visibleControl = useIsControlVisible(c, control, fields);
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
        const childField = isGroupControlsDefinition(c)
          ? c.compoundField
          : isDataControlDefinition(c)
          ? c.field
          : undefined;
        const childSchemaField = useMemo(
          () => (childField ? findField(fields, childField) : undefined),
          [fields, childField],
        );
        const childControl: Control<any> | undefined = childSchemaField
          ? control.fields[childSchemaField.field]
          : undefined;

        const defaultValueControl = useDefaultValue(
          c,
          control,
          fields,
          childSchemaField,
        );
        useControlEffect(
          () => [visibility.value, defaultValueControl.value],
          ([vc, dv]) => {
            if (vc && childControl && vc.visible === vc.showing) {
              if (!vc.visible) {
                childControl.value = undefined;
              } else if (childControl.value == null) {
                childControl.value = dv;
              }
            }
          },
          true,
        );
        const childFields =
          childSchemaField && isCompoundField(childSchemaField)
            ? childSchemaField.children
            : fields;
        const childRenderers =
          c.children?.map((cd) =>
            useControlRenderer(cd, childFields, renderer),
          ) ?? [];
        const labelAndChildren = useRenderControlLayout(
          c,
          renderer,
          childRenderers,
          control,
          childControl,
          childSchemaField,
        );
        return renderer.renderVisibility(visibility, () =>
          renderer.renderLayout(labelAndChildren),
        );
      } finally {
        stopTracking();
      }
    },
    [c, fields, renderer],
  );
  (Component as any).displayName = "RenderControl";
  return Component;
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
  children: FC<ControlRenderProps>[],
  control: Control<any>,
): GroupRendererProps {
  return {
    childCount: children?.length ?? 0,
    renderChild: (i) => {
      const RenderChild = children[i];
      return <RenderChild key={i} control={control} />;
    },
    renderOptions,
  };
}

function dataProps(
  definition: DataControlDefinition,
  field: SchemaField,
  control: Control<any>,
  globalReadonly: boolean,
): DataRendererProps {
  return {
    control,
    field,
    id: "c" + control.uniqueId,
    options: field.options,
    readonly: globalReadonly || !!definition.readonly,
    renderOptions: definition.renderOptions ?? { type: "Standard" },
    required: !!definition.required,
  };
}

export function useRenderControlLayout(
  c: ControlDefinition,
  renderer: FormRenderer,
  childRenderer: FC<ControlRenderProps>[],
  parentControl: Control<any>,
  childControl?: Control<any>,
  schemaField?: SchemaField,
): Pick<
  ControlLayoutProps,
  "label" | "errorControl" | "processLayout" | "children" | "labelText"
> {
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
    const labelText = !c.groupOptions.hideTitle ? c.title : undefined;
    return {
      children: renderer.renderGroup(
        groupProps(c.groupOptions, childRenderer, parentControl),
      ),
      label: labelText
        ? renderer.renderLabel({ label: labelText, type: LabelType.Group })
        : undefined,
      labelText,
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
      const label = !c.hideTitle
        ? renderer.renderLabel({
            label: controlTitle(c.title, field),
            type: field.collection ? LabelType.Control : LabelType.Group,
          })
        : undefined;

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
          groupProps({ type: "Standard" }, childRenderer, childControl!),
        ),
        label,
        errorControl: childControl,
      };
    }
    const props = dataProps(c, field, childControl!, false);
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
      labelText,
      label: labelText
        ? renderer.renderLabel({
            type: LabelType.Control,
            label: labelText,
            forId: props.id,
            required: c.required,
          })
        : undefined,
      errorControl: childControl,
    };
  }

  function compoundRenderer(i: number, control: Control<any>): ReactNode {
    return (
      <Fragment key={control.uniqueId}>
        {renderer.renderGroup({
          renderOptions: { type: "Standard", hideTitle: true },
          childCount: childRenderer.length,
          renderChild: (ci) => {
            const RenderChild = childRenderer[ci];
            return <RenderChild key={ci} control={control} />;
          },
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
function useExpression(
  expr: EntityExpression,
  data: Control<any>,
  fields: SchemaField[],
): Control<any | undefined> {
  switch (expr.type) {
    case ExpressionType.Jsonata:
      return useJsonataExpression(expr as JsonataExpression, data);
    case ExpressionType.FieldValue:
      return useFieldValueExpression(
        expr as FieldValueExpression,
        fields,
        data,
      );
    default:
      return useControl(undefined);
  }
}

export function useIsControlVisible(
  definition: ControlDefinition,
  data: Control<any>,
  fields: SchemaField[],
): Control<boolean | undefined> {
  const visibleExpression = definition.dynamic?.find(
    (x) => x.type === DynamicPropertyType.Visible,
  );
  if (visibleExpression && visibleExpression.expr) {
    return useExpression(visibleExpression.expr, data, fields);
  }
  return useControl(true);
}

export function useDefaultValue(
  definition: ControlDefinition,
  data: Control<any>,
  fields: SchemaField[],
  schemaField?: SchemaField,
): Control<any> {
  const defaultValueExpr = definition.dynamic?.find(
    (x) => x.type === DynamicPropertyType.DefaultValue,
  );
  if (defaultValueExpr && defaultValueExpr.expr) {
    return useExpression(defaultValueExpr.expr, data, fields);
  }
  return useControl(
    (isDataControlDefinition(definition)
      ? definition.defaultValue
      : undefined) ?? schemaField?.defaultValue,
  );
}

export function controlTitle(
  title: string | undefined | null,
  field: SchemaField,
) {
  return title ? title : fieldDisplayName(field);
}
