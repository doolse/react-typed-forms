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

export function useControlRenderer(
  c: ControlDefinition,
  fields: SchemaField[],
  renderer: FormRenderer,
): FC<ControlRenderProps> {
  const Component = useCallback(
    ({ control: parentControl }: ControlRenderProps) => {
      const stopTracking = useComponentTracking();
      try {
        const visibleControl = useIsControlVisible(c, parentControl, fields);
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
        const { control, schemaField, childFields } = lookupControlData(
          c,
          parentControl,
          fields,
        );

        const defaultValueControl = useDefaultValue(
          c,
          parentControl,
          fields,
          schemaField,
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
            useControlRenderer(cd, childFields, renderer),
          ) ?? [];
        const labelAndChildren = renderControlLayout(
          c,
          renderer,
          childRenderers.length,
          (k, i, props) => {
            const RenderChild = childRenderers[i];
            return <RenderChild key={k} {...props} />;
          },
          parentControl,
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
    [c, fields, renderer],
  );
  (Component as any).displayName = "RenderControl";
  return Component;
}

export interface ControlData {
  fieldName?: string | null;
  schemaField?: SchemaField;
  childFields: SchemaField[];
  control?: Control<any>;
}
export function lookupControlData(
  c: ControlDefinition,
  control: Control<any>,
  fields: SchemaField[],
): ControlData {
  const fieldName = isGroupControlsDefinition(c)
    ? c.compoundField
    : isDataControlDefinition(c)
    ? c.field
    : undefined;
  const schemaField = fieldName ? findField(fields, fieldName) : undefined;
  const childControl: Control<any> | undefined = schemaField
    ? control.fields[schemaField.field]
    : undefined;
  const childFields =
    schemaField && isCompoundField(schemaField) ? schemaField.children : fields;
  return { fieldName, schemaField, childFields, control: childControl };
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
  parentControl: Control<any>,
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
        groupProps(c.groupOptions, childCount, childRenderer, parentControl),
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
