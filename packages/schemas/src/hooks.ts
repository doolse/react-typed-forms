import {
  ActionControlDefinition,
  ControlDefinition,
  DataControlDefinition,
  DynamicPropertyType,
  EntityExpression,
  ExpressionType,
  FieldOption,
  FieldValueExpression,
  SchemaField,
} from "./types";
import {
  ActionControlProperties,
  controlForField,
  DataControlProperties,
  ExpressionHook,
  fieldForControl,
  findField,
  FormEditHooks,
  FormEditState,
  isGroupControl,
  isScalarField,
} from "./controlRender";
import { useEffect, useMemo } from "react";
import { Control, newControl } from "@react-typed-forms/core";

export function useDefaultValue(
  definition: DataControlDefinition,
  field: SchemaField,
  formState: FormEditState,
  useExpression: ExpressionHook
) {
  const valueExpression = definition.dynamic?.find(
    (x) => x.type === DynamicPropertyType.DefaultValue
  );
  if (valueExpression) {
    return useExpression(valueExpression.expr, formState);
  }
  return field.defaultValue;
}

export function useIsControlVisible(
  definition: ControlDefinition,
  formState: FormEditState,
  useExpression: ExpressionHook
) {
  const visibleExpression = definition.dynamic?.find(
    (x) => x.type === DynamicPropertyType.Visible
  );
  if (visibleExpression && visibleExpression.expr) {
    return Boolean(useExpression(visibleExpression.expr, formState));
  }
  const schemaFields = formState.fields;

  const { typeControl, compoundField } = useMemo(() => {
    const typeField = schemaFields.find(
      (x) => isScalarField(x) && x.isTypeField
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
  readonly?: boolean
): DataControlProperties {
  return {
    element: false,
    field,
    defaultValue,
    options: getOptionsForScalarField(field),
    required: definition.required ?? false,
    visible,
    readonly: readonly ?? definition.readonly ?? false,
    control,
  };
}

export function getOptionsForScalarField(
  field: SchemaField
): FieldOption[] | undefined | null {
  const opts = field.options ?? field.restrictions?.options;
  if (opts?.length ?? 0 > 0) {
    return opts;
  }
  return undefined;
}

export const defaultExpressionHook: ExpressionHook = (
  expr: EntityExpression,
  formState: FormEditState
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
  useExpression: ExpressionHook
): FormEditHooks {
  return {
    useExpression,
    useDataProperties(
      formState: FormEditState,
      definition: DataControlDefinition,
      field: SchemaField
    ): DataControlProperties {
      const visible = useIsControlVisible(definition, formState, useExpression);
      const defaultValue = useDefaultValue(
        definition,
        field,
        formState,
        useExpression
      );
      const scalarControl = formState.data.fields[field.field];

      useEffect(() => {
        if (!visible) scalarControl.value = null;
        else if (scalarControl.current.value == null) {
          scalarControl.value = defaultValue;
        }
      }, [visible, defaultValue]);
      return getDefaultScalarControlProperties(
        definition,
        field,
        visible,
        defaultValue,
        scalarControl,
        formState.readonly
      );
    },
    useDisplayProperties: (fs, definition) => {
      const visible = useIsControlVisible(definition, fs, useExpression);
      return { visible };
    },
    useGroupProperties: (fs, definition, hooks) => {
      const visible = useIsControlVisible(definition, fs, useExpression);
      return { visible, hooks };
    },
    useActionProperties(
      formState: FormEditState,
      definition: ActionControlDefinition
    ): ActionControlProperties {
      const visible = useIsControlVisible(definition, formState, useExpression);
      return { visible, onClick: () => {} };
    },
  };
}
