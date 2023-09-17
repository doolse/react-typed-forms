import { SchemaField } from "./types";

export * from "./types";
export * from "./schemaBuilder";
export * from "./controlRender";
export * from "./hooks";

export function fieldHasTag(field: SchemaField, tag: string) {
  return Boolean(field.tags?.includes(tag));
}

export function fieldDisplayName(field: SchemaField) {
  return field.displayName ?? field.field;
}
