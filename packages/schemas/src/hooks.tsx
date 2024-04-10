import {
  ControlDefinition,
  DataExpression,
  DataMatchExpression,
  DynamicPropertyType,
  EntityExpression,
  ExpressionType,
  isDataControlDefinition,
  JsonataExpression,
  SchemaField,
  SchemaInterface,
} from "./types";
import { useCallback, useMemo } from "react";
import {
  Control,
  useComputed,
  useControl,
  useControlEffect,
} from "@react-typed-forms/core";

import {
  ControlDataContext,
  defaultValueForField,
  findField,
  getDisplayOnlyOptions,
  getTypeField,
  isControlReadonly,
  useUpdatedRef,
} from "./util";
import jsonata from "jsonata";
import { useCalculatedControl } from "./internal";

export type UseEvalExpressionHook = (
  expr: EntityExpression | undefined,
) => EvalExpressionHook | undefined;

export function useEvalVisibilityHook(
  useEvalExpressionHook: UseEvalExpressionHook,
  definition: ControlDefinition,
  schemaField?: SchemaField,
): EvalExpressionHook<boolean> {
  const dynamicVisibility = useEvalDynamicHook(
    definition,
    DynamicPropertyType.Visible,
    useEvalExpressionHook,
  );
  const r = useUpdatedRef({ schemaField, definition });
  return useCallback(
    (ctx) => {
      const { schemaField, definition } = r.current;
      return (
        dynamicVisibility?.(ctx) ??
        useComputed(
          () =>
            matchesType(ctx, schemaField?.onlyForTypes) &&
            (!schemaField ||
              !hideDisplayOnly(
                ctx,
                schemaField,
                definition,
                ctx.schemaInterface,
              )),
        )
      );
    },
    [dynamicVisibility, r],
  );
}

export function useEvalReadonlyHook(
  useEvalExpressionHook: UseEvalExpressionHook,
  definition: ControlDefinition,
): EvalExpressionHook<boolean> {
  const dynamicReadonly = useEvalDynamicHook(
    definition,
    DynamicPropertyType.Readonly,
    useEvalExpressionHook,
  );
  const r = useUpdatedRef(definition);
  return useCallback(
    (ctx) => {
      if (dynamicReadonly) return dynamicReadonly(ctx);
      return useCalculatedControl(() => isControlReadonly(r.current));
    },
    [dynamicReadonly, r],
  );
}

export function useEvalDisabledHook(
  useEvalExpressionHook: UseEvalExpressionHook,
  definition: ControlDefinition,
): EvalExpressionHook<boolean> {
  const dynamicDisabled = useEvalDynamicHook(
    definition,
    DynamicPropertyType.Disabled,
    useEvalExpressionHook,
  );
  return useCallback(
    (ctx) => {
      if (dynamicDisabled) return dynamicDisabled(ctx);
      return useControl(false);
    },
    [dynamicDisabled],
  );
}

export function useEvalDisplayHook(
  useEvalExpressionHook: UseEvalExpressionHook,
  definition: ControlDefinition,
): (
  groupContext: ControlDataContext,
) => Control<string | undefined> | undefined {
  const dynamicDisplay = useEvalDynamicHook(
    definition,
    DynamicPropertyType.Display,
    useEvalExpressionHook,
  );
  return useCallback((ctx) => dynamicDisplay?.(ctx), [dynamicDisplay]);
}
export function useEvalDefaultValueHook(
  useEvalExpressionHook: UseEvalExpressionHook,
  definition: ControlDefinition,
  schemaField?: SchemaField,
): EvalExpressionHook {
  const dynamicValue = useEvalDynamicHook(
    definition,
    DynamicPropertyType.DefaultValue,
    useEvalExpressionHook,
  );
  const r = useUpdatedRef({ definition, schemaField });
  return useCallback(
    (ctx) => {
      const { definition, schemaField } = r.current;
      return dynamicValue?.(ctx) ?? useComputed(calcDefault);
      function calcDefault() {
        const [required, dcv] = isDataControlDefinition(definition)
          ? [definition.required, definition.defaultValue]
          : [false, undefined];
        return (
          dcv ??
          (schemaField
            ? defaultValueForField(schemaField, required)
            : undefined)
        );
      }
    },
    [dynamicValue, r],
  );
}

export type EvalExpressionHook<A = any> = (
  groupContext: ControlDataContext,
) => Control<A | undefined>;

function useDataExpression(
  fvExpr: DataExpression,
  fields: SchemaField[],
  data: Control<any>,
) {
  const refField = findField(fields, fvExpr.field);
  const otherField = refField ? data.fields[refField.field] : undefined;
  return useCalculatedControl(() => otherField?.value);
}

function useDataMatchExpression(
  fvExpr: DataMatchExpression,
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

export function defaultEvalHooks(
  expr: EntityExpression,
  context: ControlDataContext,
) {
  switch (expr.type) {
    case ExpressionType.Jsonata:
      return useJsonataExpression(
        (expr as JsonataExpression).expression,
        context.groupControl,
      );
    case ExpressionType.Data:
      return useDataExpression(
        expr as DataExpression,
        context.fields,
        context.groupControl,
      );
    case ExpressionType.DataMatch:
      return useDataMatchExpression(
        expr as DataMatchExpression,
        context.fields,
        context.groupControl,
      );
    default:
      return useControl(undefined);
  }
}

export const defaultUseEvalExpressionHook =
  makeEvalExpressionHook(defaultEvalHooks);

export function makeEvalExpressionHook(
  f: (expr: EntityExpression, context: ControlDataContext) => Control<any>,
): (expr: EntityExpression | undefined) => EvalExpressionHook | undefined {
  return (expr) => {
    const r = useUpdatedRef(expr);
    const cb = useCallback(
      (ctx: ControlDataContext) => {
        const expr = r.current!;
        return f(expr, ctx);
      },
      [expr?.type, r],
    );
    return expr ? cb : undefined;
  };
}

export function useEvalDynamicHook(
  definition: ControlDefinition,
  type: DynamicPropertyType,
  useEvalExpressionHook: (
    expr: EntityExpression | undefined,
  ) => EvalExpressionHook | undefined,
): EvalExpressionHook | undefined {
  const expression = definition.dynamic?.find((x) => x.type === type);
  return useEvalExpressionHook(expression?.expr);
}

export function matchesType(
  context: ControlDataContext,
  types?: string[] | null,
) {
  if (types == null || types.length === 0) return true;
  const typeField = getTypeField(context);
  return typeField && types.includes(typeField.value);
}

export function hideDisplayOnly(
  context: ControlDataContext,
  field: SchemaField,
  definition: ControlDefinition,
  schemaInterface: SchemaInterface,
) {
  const displayOptions = getDisplayOnlyOptions(definition);
  return (
    displayOptions &&
    !displayOptions.emptyText &&
    schemaInterface.isEmptyValue(
      field,
      context.groupControl.fields[field.field].value,
    )
  );
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
