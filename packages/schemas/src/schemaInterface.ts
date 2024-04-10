import { FieldType, SchemaField, SchemaInterface } from "./types";

export const defaultSchemaInterface: SchemaInterface = {
  isEmptyValue: defaultIsEmpty,
  textValue: defaultTextValue,
};

export function defaultIsEmpty(f: SchemaField, value: any): boolean {
  if (f.collection)
    return Array.isArray(value) ? value.length === 0 : value == null;
  switch (f.type) {
    case FieldType.String:
      return !value;
    default:
      return value == null;
  }
}

export function defaultTextValue(
  f: SchemaField,
  value: any,
): string | undefined {
  switch (f.type) {
    case FieldType.DateTime:
      return new Date(value).toLocaleDateString();
    case FieldType.Date:
      return new Date(value).toLocaleDateString();
    default:
      return value != null ? value.toString() : undefined;
  }
}
