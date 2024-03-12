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
  HtmlDisplay,
  JsonataExpression,
  TextDisplay,
} from "./types";

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
export function visibility(expr: EntityExpression): DynamicProperty {
  return { type: DynamicPropertyType.Visible, expr };
}

export function fieldEqExpr(field: string, value: any): FieldValueExpression {
  return { type: ExpressionType.FieldValue, field, value };
}
export function jsonataExpr(expression: string): JsonataExpression {
  return { type: ExpressionType.Jsonata, expression };
}

export function compoundControl(
  compoundField: string,
  title: string | undefined,
  children: ControlDefinition[],
  options?: Partial<GroupedControlsDefinition>,
): GroupedControlsDefinition {
  return {
    type: ControlDefinitionType.Group,
    compoundField,
    children,
    title,
    groupOptions: { type: "Standard", hideTitle: !title },
    ...options,
  };
}
