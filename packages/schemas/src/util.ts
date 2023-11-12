import { FieldOption, SchemaField } from "./types";

export function fieldHasTag(field: SchemaField, tag: string) {
  return Boolean(field.tags?.includes(tag));
}

export function fieldDisplayName(field: SchemaField) {
  return field.displayName ?? field.field;
}

export function hasOptions(o: {options: FieldOption[] | undefined | null})
{
  return (o.options?.length ?? 0) > 0;
}