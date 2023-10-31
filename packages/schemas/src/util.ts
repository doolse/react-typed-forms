import { SchemaField } from "./types";

export function fieldHasTag(field: SchemaField, tag: string) {
  return Boolean(field.tags?.includes(tag));
}

export function fieldDisplayName(field: SchemaField) {
  return field.displayName ?? field.field;
}
