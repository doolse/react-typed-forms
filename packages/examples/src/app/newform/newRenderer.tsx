import React, { Key, ReactNode, useMemo } from "react";
import {
  addElement,
  Control,
  newControl,
  removeElement,
  useComputed,
  useControl,
  useControlEffect,
} from "@react-typed-forms/core";
import {
  AdornmentPlacement,
  CompoundField,
  ControlAdornment,
  ControlDefinition,
  ControlDefinitionType,
  controlForField,
  ControlInput,
  controlTitle,
  dataControl,
  DataControlDefinition,
  DisplayData,
  DynamicPropertyType,
  elementValueForField,
  EntityExpression,
  ExpressionType,
  fieldForControl,
  FieldOption,
  FieldType,
  FieldValueExpression,
  findField,
  FormDataContext,
  FormEditState,
  GroupedControlsDefinition,
  GroupRenderOptions,
  isActionControlsDefinition,
  isCompoundField,
  isDataControlDefinition,
  isDisplayControlsDefinition,
  isGridRenderer,
  isGroupControlsDefinition,
  isScalarField,
  JsonataExpression,
  RenderOptions,
  SchemaField,
  SchemaHooks,
} from "@react-typed-forms/schemas";
import jsonata from "jsonata";

export interface FormRenderer {
  renderData: (
    props: DataRendererProps,
    asArray: (() => ReactNode) | undefined,
  ) => ReactNode;
  renderGroup: (props: GroupRendererProps) => ReactNode;
  renderDisplay: (props: DisplayData) => ReactNode;
  renderAction: (props: ActionRendererProps) => ReactNode;
  renderArray: (props: ArrayRendererProps, renderer: FormRenderer) => ReactNode;
  renderAdornment: (props: AdornmentProps) => AdornmentRenderer;
  renderTitle: (
    title: ReactNode,
    required?: boolean,
    forId?: string,
  ) => ReactNode;
  renderLayout: (props: ControlLayoutProps) => ReactNode;
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
  visibility: Control<Visibility>;
  labelStart?: ReactNode;
  label?: ReactNode;
  labelEnd?: ReactNode;
  controlStart?: ReactNode;
  children?: ReactNode;
  controlEnd?: ReactNode;
  errorControl?: Control<any>;
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

function testData(props: DataRendererProps) {
  return (
    <ControlInput
      id={props.id}
      readOnly={props.readonly}
      control={props.control}
      convert={createInputConversion(props.field.type)}
    />
  );
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

const defaultFormRenderer: FormRenderer = {
  renderAction(props: ActionRendererProps): React.ReactNode {
    return <button onClick={props.onClick}>{props.actionText}</button>;
  },
  renderAdornment(props: AdornmentProps): AdornmentRenderer {
    return {};
  },
  renderArray(
    props: ArrayRendererProps,
    renderer: FormRenderer,
  ): React.ReactNode {
    return (
      <div>
        {Array.from({ length: props.childCount }).map((x, i) =>
          props.renderChild(i),
        )}
        {props.addAction && renderer.renderAction(props.addAction)}
      </div>
    );
  },
  renderData(
    props: DataRendererProps,
    asArray: (() => ReactNode) | undefined,
  ): React.ReactNode {
    if (asArray) return asArray();
    return testData(props);
  },
  renderDisplay(props: DisplayData): React.ReactNode {
    return undefined;
  },
  renderGroup(props: GroupRendererProps): React.ReactNode {
    return (
      <div>
        {Array.from({ length: props.childCount }).map((x, i) =>
          props.renderChild(i),
        )}
      </div>
    );
  },
  renderLayout(props: ControlLayoutProps): React.ReactNode {
    return (
      <div>
        {props.label}
        {props.children}
      </div>
    );
  },
  renderTitle(title: ReactNode, required, forId): React.ReactNode {
    return (
      <label htmlFor={forId}>
        {title}
        {required ? " *" : ""}
      </label>
    );
  },
};

interface ControlContext {
  control: Control<any>;
  fields: SchemaField[];
  typeControl?: Control<string>;
}

export function makeContext(
  control: Control<any>,
  fields: SchemaField[],
): ControlContext {
  const typeField = fields.find((x) => x.isTypeField);
  return {
    control,
    fields,
    typeControl: typeField ? control.fields[typeField.field] : undefined,
  };
}

/** @trackControls **/
export function RenderNewControl({
  c,
  ctx,
}: {
  c: ControlDefinition;
  ctx: ControlContext;
}): ReactNode {
  const visibility = useControl<Visibility>({ visible: true, showing: true });
  const childField = isGroupControlsDefinition(c)
    ? c.compoundField
    : isDataControlDefinition(c)
    ? c.field
    : undefined;
  const childSchemaField = useMemo(
    () => (childField ? findField(ctx.fields, childField) : undefined),
    [ctx.fields, childField],
  );
  const childControl: Control<any> = childSchemaField
    ? ctx.control.fields[childSchemaField.field]
    : newControl(undefined);
  const labelAndChildren = renderLayoutChildren(c, defaultFormRenderer);
  return defaultFormRenderer.renderLayout({ visibility, ...labelAndChildren });

  function renderLayoutChildren(
    c: ControlDefinition,
    renderer: FormRenderer,
    // control: Control<any>,
  ): Pick<ControlLayoutProps, "label" | "children" | "errorControl"> {
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
          groupProps(c.groupOptions, c.children, ctx),
        ),
        label: !c.groupOptions.hideTitle
          ? renderer.renderTitle(c.title)
          : undefined,
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
      return { children: renderer.renderDisplay(c.displayData) };
    }
    return {};

    function renderData(c: DataControlDefinition) {
      const field: SchemaField = childSchemaField ?? {
        field: c.field,
        type: FieldType.String,
      };
      const label = !c.hideTitle
        ? renderer.renderTitle(controlTitle(c.title, field))
        : undefined;
      if (isCompoundField(field)) {
        if (field.collection) {
          return {
            label,
            children: renderArray(
              renderer,
              field,
              childControl!,
              compoundRenderer(field, c.children ?? []),
            ),
            errorControl: childControl,
          };
        }
        return {
          children: renderer.renderGroup(
            groupProps(
              { type: "Standard" },
              c.children,
              makeContext(childControl, field.children),
            ),
          ),
          label,
          errorControl: childControl,
        };
      }
      const props = dataProps(c, field, childControl, false);
      return {
        children: renderer.renderData(
          props,
          field.collection
            ? () =>
                renderArray(
                  renderer,
                  field,
                  childControl,
                  scalarRenderer(props),
                )
            : undefined,
        ),
        label,
        errorControl: childControl,
      };
    }

    function compoundRenderer(
      compoundField: CompoundField,
      children: ControlDefinition[],
    ): (i: number, control: Control<any>) => ReactNode {
      return (i, control: Control<any>) =>
        renderer.renderGroup({
          renderOptions: { type: "Standard", hideTitle: true },
          childCount: children.length,
          renderChild: (ci) => (
            <RenderNewControl
              c={children[ci]}
              ctx={makeContext(control, compoundField.children)}
            />
          ),
        });
    }

    function scalarRenderer(
      dataProps: DataRendererProps,
    ): (i: number, control: Control<any>) => ReactNode {
      return (i, control) =>
        renderer.renderData({ ...dataProps, control }, undefined);
    }
  }
}

function renderArray(
  renderer: FormRenderer,
  field: SchemaField,
  controlArray: Control<any[] | undefined | null>,
  renderChild: (elemIndex: number, control: Control<any>) => ReactNode,
) {
  const elems = controlArray.elements ?? [];
  return renderer.renderArray(
    {
      childCount: elems.length,
      addAction: {
        actionId: "add",
        actionText: "Add",
        onClick: () => addElement(controlArray, elementValueForField(field)),
      },
      childKey: (i) => elems[i].uniqueId,
      removeAction: (i: number) => ({
        actionId: "",
        actionText: "Remove",
        onClick: () => removeElement(controlArray, i),
      }),
      renderChild: (i) => renderChild(i, elems[i]),
    },
    renderer,
  );
}
function groupProps(
  renderOptions: GroupRenderOptions,
  children: ControlDefinition[] | null | undefined,
  ctx: ControlContext,
): GroupRendererProps {
  return {
    childCount: children?.length ?? 0,
    renderChild: (i) => <RenderNewControl c={children![i]} ctx={ctx} />,
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

export function useIsControlVisible(
  definition: ControlDefinition,
  formState: FormEditState,
  hooks: SchemaHooks,
): Visibility {
  const visibleExpression = definition.dynamic?.find(
    (x) => x.type === DynamicPropertyType.Visible,
  );
  if (visibleExpression && visibleExpression.expr) {
    const exprValue = hooks.useExpression(
      visibleExpression.expr,
      formState,
    ).value;
    return {
      value: exprValue,
      canChange: true,
    };
  }
  const schemaFields = formState.fields;

  const typeControl = useMemo(() => {
    const typeField = schemaFields.find(
      (x) => isScalarField(x) && x.isTypeField,
    ) as SchemaField | undefined;

    return ((typeField && formState.data.fields?.[typeField.field]) ??
      newControl(undefined)) as Control<string | undefined>;
  }, [schemaFields, formState.data]);

  const fieldName = fieldForControl(definition);
  const schemaField = fieldName
    ? findField(schemaFields, fieldName)
    : undefined;
  const isSingleCompoundField =
    schemaField &&
    schemaField.type === FieldType.Compound &&
    !schemaField.collection;
  const onlyForTypes = schemaField?.onlyForTypes ?? [];
  const canChange = Boolean(isSingleCompoundField || onlyForTypes.length);
  const value =
    (!isSingleCompoundField ||
      formState.data.fields[fieldName!].value != null) &&
    (!onlyForTypes.length ||
      Boolean(typeControl.value && onlyForTypes.includes(typeControl.value)));
  return { value, canChange };
}

function useExpression(
  expr: EntityExpression,
  formState: FormEditState,
): Control<any | undefined> {
  switch (expr.type) {
    case ExpressionType.Jsonata:
      const jExpr = expr as JsonataExpression;
      const compiledExpr = useMemo(
        () => jsonata(jExpr.expression),
        [jExpr.expression],
      );
      const control = useControl();
      useControlEffect(
        () => formState.data.value,
        async (v) => {
          control.value = await compiledExpr.evaluate(v);
        },
        true,
      );
      return control;
    case ExpressionType.FieldValue:
      const fvExpr = expr as FieldValueExpression;
      return useComputed(() => {
        const fv = controlForField(fvExpr.field, formState).value;
        return Array.isArray(fv)
          ? fv.includes(fvExpr.value)
          : fv === fvExpr.value;
      });
    default:
      return useControl(undefined);
  }
}
