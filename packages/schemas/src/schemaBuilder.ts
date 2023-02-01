import {
  CompoundField,
  FieldOption,
  FieldType,
  ScalarField,
  SchemaField,
  SchemaFieldType,
} from "./types";

type AllowedSchema<T> = T extends string
  ? ScalarField & {
      schemaType: SchemaFieldType.Scalar;
      type: FieldType.String | FieldType.Date | FieldType.DateTime;
    }
  : T extends number
  ? ScalarField & {
      schemaType: SchemaFieldType.Scalar;
      type: FieldType.Int | FieldType.Double;
    }
  : T extends boolean
  ? ScalarField & {
      schemaType: SchemaFieldType.Scalar;
      type: FieldType.Bool;
    }
  : T extends Array<infer E>
  ? AllowedSchema<E> & {
      collection: true;
    }
  : T extends { [key: string]: any }
  ? CompoundField & {
      schemaType: SchemaFieldType.Compound;
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
  options?: Partial<Omit<ScalarField, "schemaType" | "type">>
) {
  return makeScalarField({ type: FieldType.String, displayName, ...options });
}

export function stringOptionsField(
  displayName: string,
  ...options: FieldOption[]
) {
  return makeScalarField({
    type: FieldType.String,
    displayName,
    restrictions: { options },
  });
}

export function withScalarOptions<S extends ScalarField>(
  options: Partial<ScalarField>,
  v: (name: string) => S
): (name: string) => S {
  return (n) => ({ ...v(n), ...options });
}

export function makeScalarField<S extends Partial<ScalarField>>(
  options: S
): (name: string) => ScalarField & { schemaType: SchemaFieldType.Scalar } & S {
  return (n) => ({ ...defaultScalarField(n, n), ...options });
}

export function makeCompoundField<S extends Partial<CompoundField>>(
  options: S
): (name: string) => CompoundField & {
  schemaType: SchemaFieldType.Compound;
  type: FieldType.Compound;
} & S {
  return (n) => ({ ...defaultCompoundField(n, n, false), ...options });
}

export function intField(
  displayName: string,
  options?: Partial<Omit<ScalarField, "schemaType" | "type">>
) {
  return makeScalarField({ type: FieldType.Int, displayName, ...options });
}

export function boolField(
  displayName: string,
  options?: Partial<Omit<ScalarField, "schemaType" | "type">>
) {
  return makeScalarField({ type: FieldType.Bool, displayName, ...options });
}

export function compoundField<
  Other extends Partial<Omit<CompoundField, "type" | "schemaType">>
>(
  displayName: string,
  fields: SchemaField[],
  other: Other
): (name: string) => CompoundField & {
  schemaType: SchemaFieldType.Compound;
  type: FieldType.Compound;
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
): ScalarField & {
  schemaType: SchemaFieldType.Scalar;
  type: FieldType.String;
} {
  return {
    restrictions: {
      options: [],
    },
    tags: [],
    field,
    displayName,
    type: FieldType.String,
    collection: false,
    searchable: false,
    schemaType: SchemaFieldType.Scalar,
    system: false,
    entityRefType: "",
    parentField: "",
    required: false,
    defaultValue: undefined,
    onlyForTypes: [],
    isTypeField: false,
  };
}

export function defaultCompoundField(
  field: string,
  displayName: string,
  collection: boolean
): CompoundField & {
  type: FieldType.Compound;
  schemaType: SchemaFieldType.Compound;
} {
  return {
    tags: [],
    field,
    displayName,
    type: FieldType.Compound,
    collection,
    schemaType: SchemaFieldType.Compound,
    system: false,
    treeChildren: false,
    children: [],
    onlyForTypes: [],
    required: true,
  };
}
