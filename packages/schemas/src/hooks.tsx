import {
  ActionControlDefinition,
  ControlDefinition,
  ControlDefinitionType,
  DataControlDefinition,
  DynamicPropertyType,
  EntityExpression,
  ExpressionType,
  FieldOption,
  FieldValueExpression,
  GroupedControlsDefinition,
  SchemaField,
} from "./types";
import {
  ActionRendererProps,
  ArrayRendererProps,
  controlForField,
  controlTitle,
  DataRendererProps,
  elementValueForField,
  ExpressionHook,
  fieldForControl,
  findCompoundField,
  findField,
  FormEditHooks,
  FormEditState,
  FormRendererComponents,
  GroupRendererProps,
  isGroupControl,
  isScalarField,
  renderControl,
} from "./controlRender";
import React, { Fragment, ReactElement, useEffect, useMemo } from "react";
import {
  addElement,
  Control,
  newControl,
  removeElement,
} from "@react-typed-forms/core";

export function useDefaultValue(
  definition: DataControlDefinition,
  field: SchemaField,
  formState: FormEditState,
  useExpression: ExpressionHook,
) {
  const valueExpression = definition.dynamic?.find(
    (x) => x.type === DynamicPropertyType.DefaultValue,
  );
  if (valueExpression) {
    return useExpression(valueExpression.expr, formState);
  }
  return field.defaultValue;
}

export function useIsControlVisible(
  definition: ControlDefinition,
  formState: FormEditState,
  useExpression: ExpressionHook,
) {
  const visibleExpression = definition.dynamic?.find(
    (x) => x.type === DynamicPropertyType.Visible,
  );
  if (visibleExpression && visibleExpression.expr) {
    return Boolean(useExpression(visibleExpression.expr, formState));
  }
  const schemaFields = formState.fields;

  const { typeControl, compoundField } = useMemo(() => {
    const typeField = schemaFields.find(
      (x) => isScalarField(x) && x.isTypeField,
    ) as SchemaField | undefined;

    const typeControl = ((typeField &&
      formState.data.fields?.[typeField.field]) ??
      newControl(undefined)) as Control<string | undefined>;
    const compoundField =
      isGroupControl(definition) && definition.compoundField
        ? formState.data.fields[definition.compoundField]
        : undefined;
    return { typeControl, compoundField };
  }, [schemaFields, formState.data]);

  const fieldName = fieldForControl(definition);
  const onlyForTypes = (
    fieldName ? findField(schemaFields, fieldName) : undefined
  )?.onlyForTypes;

  return (
    (!compoundField || compoundField.value != null) &&
    (!onlyForTypes ||
      onlyForTypes.length === 0 ||
      Boolean(typeControl.value && onlyForTypes.includes(typeControl.value)))
  );
}

export function getDefaultScalarControlProperties(
  definition: DataControlDefinition,
  field: SchemaField,
  visible: boolean,
  defaultValue: any,
  control: Control<any>,
  formState: FormEditState,
): DataRendererProps {
  return {
    definition,
    field,
    defaultValue,
    options: getOptionsForScalarField(field),
    required: definition.required ?? false,
    visible,
    readonly: formState.readonly ?? definition.readonly ?? false,
    control,
    formState,
  };
}

export function getOptionsForScalarField(
  field: SchemaField,
): FieldOption[] | undefined | null {
  const opts = field.options ?? field.restrictions?.options;
  if (opts?.length ?? 0 > 0) {
    return opts;
  }
  return undefined;
}

export const defaultExpressionHook: ExpressionHook = (
  expr: EntityExpression,
  formState: FormEditState,
) => {
  switch (expr.type) {
    case ExpressionType.FieldValue:
      const fvExpr = expr as FieldValueExpression;
      return controlForField(fvExpr.field, formState).value === fvExpr.value;
    default:
      return undefined;
  }
};

export function createFormEditHooks(
  useExpression: ExpressionHook,
): FormEditHooks {
  return {
    useExpression,
    useDataProperties(
      formState: FormEditState,
      definition: DataControlDefinition,
      field: SchemaField,
      renderer: FormRendererComponents,
    ): DataRendererProps {
      const visible = useIsControlVisible(definition, formState, useExpression);
      const defaultValue = useDefaultValue(
        definition,
        field,
        formState,
        useExpression,
      );
      const scalarControl = formState.data.fields[field.field];

      useEffect(() => {
        if (!visible) scalarControl.value = null;
        else if (scalarControl.current.value == null) {
          scalarControl.value = defaultValue;
        }
      }, [visible, defaultValue]);
      const dataProps = getDefaultScalarControlProperties(
        definition,
        field,
        visible,
        defaultValue,
        scalarControl,
        formState,
      );
      if (!field.collection) return dataProps;
      return {
        ...dataProps,
        array: defaultArrayRendererProps(
          scalarControl,
          field,
          definition,
          dataProps.readonly,
          (c) => renderer.renderData({ ...dataProps, control: c }),
        ),
      };
    },
    useDisplayProperties: (fs, definition) => {
      const visible = useIsControlVisible(definition, fs, useExpression);
      return { visible, definition };
    },
    useGroupProperties: (fs, definition, hooks, renderers) => {
      const visible = useIsControlVisible(definition, fs, useExpression);
      const field = definition.compoundField
        ? findCompoundField(fs.fields, definition.compoundField)
        : undefined;
      const newFs = field
        ? { ...fs, fields: field.children, data: fs.data.fields[field.field] }
        : fs;
      const groupProps = {
        visible,
        hooks,
        hideTitle: definition.groupOptions.hideTitle ?? false,
        childCount: definition.children.length,
        renderChild: (i) =>
          renderControl(definition.children[i], newFs, hooks, i),
        definition,
      } satisfies GroupRendererProps;
      if (field?.collection) {
        return {
          ...groupProps,
          array: defaultArrayRendererProps(
            newFs.data,
            field,
            definition,
            fs.readonly,
            (e) =>
              renderers.renderGroup({
                ...groupProps,
                hideTitle: true,
                renderChild: (i) =>
                  renderControl(
                    definition.children[i],
                    { ...newFs, data: e },
                    hooks,
                    i,
                  ),
              }),
          ),
        };
      }
      return groupProps;
    },
    useActionProperties(
      formState: FormEditState,
      definition: ActionControlDefinition,
    ): ActionRendererProps {
      const visible = useIsControlVisible(definition, formState, useExpression);
      return {
        visible,
        onClick: () => {},
        definition,
      };
    },
  };
}

function defaultArrayRendererProps(
  control: Control<any[]>,
  field: SchemaField,
  definition: DataControlDefinition | GroupedControlsDefinition,
  readonly: boolean | undefined | null,
  renderElem: (c: Control<any>) => ReactElement,
): ArrayRendererProps {
  return {
    control,
    childCount: control.elements?.length ?? 0,
    field,
    definition,
    addAction: !readonly
      ? {
          definition: {
            title: "Add " + controlTitle(definition.title, field),
            type: ControlDefinitionType.Action,
            actionId: "addElement",
          },
          visible: true,
          onClick: () => addElement(control, elementValueForField(field)),
        }
      : undefined,
    removeAction: !readonly
      ? (i) => ({
          definition: {
            title: "Remove",
            type: ControlDefinitionType.Action,
            actionId: "removeElement",
          },
          visible: true,
          onClick: () => removeElement(control, control.elements[i]),
        })
      : undefined,
    childKey: (i) => control.elements[i].uniqueId,
    renderChild: (i) => {
      const c = control.elements[i];
      return <Fragment key={c.uniqueId}>{renderElem(c)}</Fragment>;
    },
  };
}
