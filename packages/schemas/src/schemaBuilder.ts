import { CompoundField, FieldOption, FieldType, SchemaField } from "./types";

type AllowedSchema<T> = T extends string
  ? SchemaField & {
      type: FieldType.String | FieldType.Date | FieldType.DateTime;
    }
  : T extends number
  ? SchemaField & {
      type: FieldType.Int | FieldType.Double;
    }
  : T extends boolean
  ? SchemaField & {
      type: FieldType.Bool;
    }
  : T extends Array<infer E>
  ? AllowedSchema<E> & {
      collection: true;
    }
  : T extends { [key: string]: any }
  ? CompoundField & {
      type: FieldType.Compound;
    }
  : never;
type AllowedField<T> = (name: string) => AllowedSchema<T>;

export function buildSchema<T>(def: {
  [K in keyof T]-?: AllowedField<T[K]>;
}): SchemaField[] {
  return Object.entries(def).map((x) =>
    (x[1] as (n: string) => SchemaField)(x[0])
  );
}

export function stringField(
  displayName: string,
  options?: Partial<Omit<SchemaField, "type">>
) {
  return makeScalarField({
    type: FieldType.String as const,
    displayName,
    ...options,
  });
}

export function stringOptionsField(
  displayName: string,
  ...options: FieldOption[]
) {
  return makeScalarField({
    type: FieldType.String as const,
    displayName,
    options,
  });
}

export function withScalarOptions<S extends SchemaField>(
  options: Partial<SchemaField>,
  v: (name: string) => S
): (name: string) => S {
  return (n) => ({ ...v(n), ...options });
}

export function makeScalarField<S extends Partial<SchemaField>>(
  options: S
): (name: string) => SchemaField & S {
  return (n) => ({ ...defaultScalarField(n, n), ...options });
}

export function makeCompoundField<S extends Partial<CompoundField>>(
  options: S
): (name: string) => CompoundField & {
  type: FieldType.Compound;
} & S {
  return (n) => ({ ...defaultCompoundField(n, n, false), ...options });
}

export function intField(
  displayName: string,
  options?: Partial<Omit<SchemaField, "type">>
) {
  return makeScalarField({
    type: FieldType.Int as const,
    displayName,
    ...options,
  });
}

export function boolField(
  displayName: string,
  options?: Partial<Omit<SchemaField, "type">>
) {
  return makeScalarField({
    type: FieldType.Bool as const,
    displayName,
    ...options,
  });
}

export function compoundField<
  Other extends Partial<Omit<CompoundField, "type" | "schemaType">>
>(
  displayName: string,
  fields: SchemaField[],
  other: Other
): (name: string) => CompoundField & {
  collection: Other["collection"];
} {
  return (field) =>
    ({
      ...defaultCompoundField(field, displayName, false),
      ...other,
      children: fields,
    } as any);
}

export function defaultScalarField(
  field: string,
  displayName: string
): Omit<SchemaField, "type"> & {
  type: FieldType.String;
} {
  return {
    field,
    displayName,
    type: FieldType.String,
  };
}

export function defaultCompoundField(
  field: string,
  displayName: string,
  collection: boolean
): CompoundField & {
  type: FieldType.Compound;
} {
  return {
    tags: [],
    field,
    displayName,
    type: FieldType.Compound,
    collection,
    system: false,
    treeChildren: false,
    children: [],
    onlyForTypes: [],
    required: true,
  };
}
