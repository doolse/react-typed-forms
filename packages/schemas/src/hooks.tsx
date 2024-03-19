import {
  ControlDefinition,
  DynamicPropertyType,
  EntityExpression,
  ExpressionType,
  FieldValueExpression,
  isDataControlDefinition,
  JsonataExpression,
  SchemaField,
} from "./types";
import { useCallback, useMemo } from "react";
import {
  Control,
  useComputed,
  useControl,
  useControlEffect,
} from "@react-typed-forms/core";

import {
  ControlGroupContext,
  findField,
  getTypeField,
  useUpdatedRef,
} from "./util";
import jsonata from "jsonata";

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
          return useJsonataExpression(
            (expr as JsonataExpression).expression,
            groupControl,
          );
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

export function useJsonataExpression(
  jExpr: string,
  data: Control<any>,
): Control<any> {
  const compiledExpr = useMemo(() => jsonata(jExpr), [jExpr]);
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
