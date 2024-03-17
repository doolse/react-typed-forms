import React, {
  FC,
  Fragment,
  Key,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import {
  addElement,
  Control,
  newControl,
  removeElement,
  RenderOptional,
  useComponentTracking,
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
  visibility: Control<Visibility | undefined>;
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
    return <DefaultLayout {...props} />;
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

function DefaultLayout({ visibility, label, children }: ControlLayoutProps) {
  const v = visibility.value;
  useEffect(() => {
    if (v) {
      visibility.setValue((ex) => ({ visible: v.visible, showing: v.visible }));
    }
  }, [v?.visible]);
  return v?.visible ? (
    <div>
      <Fragment key="label">{label}</Fragment>
      <Fragment key="children">{children}</Fragment>
    </div>
  ) : (
    <></>
  );
}

export interface ControlRenderProps {
  control: Control<any>;
}

export function useControlRenderer(
  c: ControlDefinition,
  fields: SchemaField[],
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
          c.children?.map((cd) => useControlRenderer(cd, childFields)) ?? [];
        const labelAndChildren = useRenderControlLayout(
          c,
          defaultFormRenderer,
          childRenderers,
          control,
          childControl,
          childSchemaField,
        );
        return defaultFormRenderer.renderLayout({
          visibility,
          ...labelAndChildren,
        });
      } finally {
        stopTracking();
      }
    },
    [c, fields],
  );
  (Component as any).displayName = "RenderControl";
  return Component;
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
        groupProps(c.groupOptions, childRenderer, parentControl),
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
    const field: SchemaField = schemaField ?? {
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
    return {
      children: renderer.renderData(
        props,
        field.collection
          ? () =>
              renderArray(renderer, field, childControl!, scalarRenderer(props))
          : undefined,
      ),
      label,
      errorControl: childControl,
    };
  }

  function compoundRenderer(i: number, control: Control<any>): ReactNode {
    return (
      <Fragment key={i}>
        {renderer.renderGroup({
          renderOptions: { type: "Standard", hideTitle: true },
          childCount: childRenderer.length,
          renderChild: (ci) => {
            const RenderChild = childRenderer[ci];
            const childKey = "a" + ci + "_" + control.uniqueId;
            return <RenderChild key={childKey} control={control} />;
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
          {renderer.renderData({ ...dataProps, control }, undefined)}
        </Fragment>
      );
    };
  }
}

function useExpression(
  expr: EntityExpression,
  data: Control<any>,
  fields: SchemaField[],
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
        () => data.value,
        async (v) => {
          control.value = await compiledExpr.evaluate(v);
        },
        true,
      );
      return control;
    case ExpressionType.FieldValue:
      const fvExpr = expr as FieldValueExpression;
      return useComputed(() => {
        const refField = findField(fields, fvExpr.field);
        const fv = refField ? data.fields[refField.field].value : undefined;
        return Array.isArray(fv)
          ? fv.includes(fvExpr.value)
          : fv === fvExpr.value;
      });
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
