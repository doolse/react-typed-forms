import {
  ControlDefinition,
  ControlDefinitionType,
  DataControlDefinition,
  DisplayControlDefinition,
  DisplayDataType,
  DynamicProperty,
  DynamicPropertyType,
  EntityExpression,
  ExpressionType,
  FieldValueExpression,
  GroupedControlsDefinition,
  GroupRenderType,
  HtmlDisplay,
  JsonataExpression,
  SchemaField,
  TextDisplay,
} from "./types";
import { ActionRendererProps } from "./controlRender";
import { useMemo } from "react";
import { addMissingControls } from "./util";

export function dataControl(
  field: string,
  title?: string | null,
  options?: Partial<DataControlDefinition>,
): DataControlDefinition {
  return { type: ControlDefinitionType.Data, field, title, ...options };
}

export function textDisplayControl(
  text: string,
  options?: Partial<DisplayControlDefinition>,
): DisplayControlDefinition {
  return {
    type: ControlDefinitionType.Display,
    displayData: { type: DisplayDataType.Text, text } as TextDisplay,
    ...options,
  };
}

export function htmlDisplayControl(
  html: string,
  options?: Partial<DisplayControlDefinition>,
): DisplayControlDefinition {
  return {
    type: ControlDefinitionType.Display,
    displayData: { type: DisplayDataType.Html, html } as HtmlDisplay,
    ...options,
  };
}

export function dynamicDefaultValue(expr: EntityExpression): DynamicProperty {
  return { type: DynamicPropertyType.DefaultValue, expr };
}

export function dynamicReadonly(expr: EntityExpression): DynamicProperty {
  return { type: DynamicPropertyType.Readonly, expr };
}

export function dynamicVisibility(expr: EntityExpression): DynamicProperty {
  return { type: DynamicPropertyType.Visible, expr };
}

export function dynamicDisabled(expr: EntityExpression): DynamicProperty {
  return { type: DynamicPropertyType.Disabled, expr };
}

export function fieldEqExpr(field: string, value: any): FieldValueExpression {
  return { type: ExpressionType.FieldValue, field, value };
}
export function jsonataExpr(expression: string): JsonataExpression {
  return { type: ExpressionType.Jsonata, expression };
}

export function groupedControl(
  children: ControlDefinition[],
  title?: string,
  options?: Partial<GroupedControlsDefinition>,
): GroupedControlsDefinition {
  return {
    type: ControlDefinitionType.Group,
    children,
    title,
    groupOptions: { type: "Standard", hideTitle: !title },
    ...options,
  };
}
export function compoundControl(
  field: string,
  title: string | undefined,
  children: ControlDefinition[],
  options?: Partial<DataControlDefinition>,
): DataControlDefinition {
  return {
    type: ControlDefinitionType.Data,
    field,
    children,
    title,
    renderOptions: { type: "Standard" },
    ...options,
  };
}

export function createAction(
  actionId: string,
  onClick: () => void,
  actionText?: string,
): ActionRendererProps {
  return { actionId, onClick, actionText: actionText ?? actionId };
}

export const emptyGroupDefinition: GroupedControlsDefinition = {
  type: ControlDefinitionType.Group,
  children: [],
  groupOptions: { type: GroupRenderType.Standard, hideTitle: true },
};

export function useControlDefinitionForSchema(
  sf: SchemaField[],
  definition: GroupedControlsDefinition = emptyGroupDefinition,
): GroupedControlsDefinition {
  return useMemo<GroupedControlsDefinition>(
    () => ({
      ...definition,
      children: addMissingControls(sf, definition.children ?? []),
    }),
    [sf, definition],
  );
}
