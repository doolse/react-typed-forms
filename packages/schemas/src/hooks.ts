import {
  ActionControlDefinition,
  DataControlDefinition,
  DynamicPropertyType,
  EntityExpression,
  ExpressionType,
  FieldOption,
  FieldValueExpression,
  ScalarField,
  ControlDefinition,
} from "./types";
import {
  ActionControlProperties,
  controlForField,
  DataControlProperties,
  fieldForControl,
  findField,
  FormEditHooks,
  FormEditState,
  isScalarField,
} from "./controlRender";
import { useMemo } from "react";
import { Control, newControl, useControlValue } from "@react-typed-forms/core";

export type ExpressionHook = (
  expr: EntityExpression,
  formState: FormEditState
) => any;
export function useDefaultValue(
  definition: DataControlDefinition,
  field: ScalarField,
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

  const typeControl = useMemo(() => {
    const typeField = schemaFields.find(
      (x) => isScalarField(x) && x.isTypeField
    ) as ScalarField | undefined;
    return ((typeField && formState.data.fields?.[typeField.field]) ??
      newControl(undefined)) as Control<string | undefined>;
  }, [schemaFields, formState.data]);

  const fieldName = fieldForControl(definition);
  const onlyForTypes = (
    fieldName ? findField(schemaFields, fieldName) : undefined
  )?.onlyForTypes;
  return useControlValue(
    () =>
      !onlyForTypes ||
      onlyForTypes.length === 0 ||
      Boolean(typeControl.value && onlyForTypes.includes(typeControl.value))
  );
}

export function getDefaultScalarControlProperties(
  control: DataControlDefinition,
  field: ScalarField,
  visible: boolean,
  defaultValue: any
): DataControlProperties {
  return {
    defaultValue,
    options: getOptionsForScalarField(field),
    required: control.required,
    visible,
  };
}

export function getOptionsForScalarField(
  field: ScalarField
): FieldOption[] | undefined {
  const opts = field.restrictions?.options;
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
      return useControlValue(
        () => controlForField(fvExpr.field, formState).value === fvExpr.value
      );
    default:
      return undefined;
  }
};

export function createFormEditHooks(
  useExpression: ExpressionHook
): FormEditHooks {
  return {
    useDataProperties(
      formState: FormEditState,
      definition: DataControlDefinition,
      field: ScalarField
    ): DataControlProperties {
      const visible = useIsControlVisible(definition, formState, useExpression);
      const defaultValue = useDefaultValue(
        definition,
        field,
        formState,
        useExpression
      );
      return getDefaultScalarControlProperties(
        definition,
        field,
        visible,
        defaultValue
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
