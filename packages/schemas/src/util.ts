import {
  CompoundField,
  ControlDefinition, ControlDefinitionType,
  DataControlDefinition, DataRenderType,
  FieldOption, FieldType, GridRenderer,
  GroupedControlsDefinition, GroupRenderType,
  SchemaField
} from "./types";

export function applyDefaultValues(
    v: { [k: string]: any } | undefined,
    fields: SchemaField[],
): any {
  if (!v) return defaultValueForFields(fields);
  const applyValue = fields.filter(
      (x) => isCompoundField(x) || !(x.field in v),
  );
  if (!applyValue.length) return v;
  const out = { ...v };
  applyValue.forEach((x) => {
    out[x.field] =
        x.field in v
            ? applyDefaultForField(v[x.field], x, fields)
            : defaultValueForField(x);
  });
  return out;
}

export function applyDefaultForField(
    v: any,
    field: SchemaField,
    parent: SchemaField[],
    notElement?: boolean,
): any {
  if (field.collection && !notElement) {
    return ((v as any[]) ?? []).map((x) =>
        applyDefaultForField(x, field, parent, true),
    );
  }
  if (isCompoundField(field)) {
    if (!v && !field.required) return v;
    return applyDefaultValues(v, field.treeChildren ? parent : field.children);
  }
  return defaultValueForField(field);
}

export function defaultValueForFields(fields: SchemaField[]): any {
  return Object.fromEntries(
      fields.map((x) => [x.field, defaultValueForField(x)]),
  );
}

export function defaultValueForField(sf: SchemaField): any {
  if (isCompoundField(sf)) {
    return sf.required
        ? sf.collection
            ? []
            : defaultValueForFields(sf.children)
        : undefined;
  }
  if (sf.collection) return [];
  return sf.defaultValue;
}

export function elementValueForField(sf: SchemaField): any {
  if (isCompoundField(sf)) {
    return defaultValueForFields(sf.children);
  }
  return sf.defaultValue;
}

export function findScalarField(
    fields: SchemaField[],
    field: string,
): SchemaField | undefined {
  return findField(fields, field);
}

export function findCompoundField(
    fields: SchemaField[],
    field: string,
): CompoundField | undefined {
  return findField(fields, field) as CompoundField | undefined;
}

export function findField(
    fields: SchemaField[],
    field: string,
): SchemaField | undefined {
  return fields.find((x) => x.field === field);
}

export function isScalarField(sf: SchemaField): sf is SchemaField {
  return !isCompoundField(sf);
}

export function isCompoundField(sf: SchemaField): sf is CompoundField {
  return sf.type === FieldType.Compound;
}

export function isDataControl(
    c: ControlDefinition,
): c is DataControlDefinition {
  return c.type === ControlDefinitionType.Data;
}

export function isGroupControl(
    c: ControlDefinition,
): c is GroupedControlsDefinition {
  return c.type === ControlDefinitionType.Group;
}

export function fieldHasTag(field: SchemaField, tag: string) {
  return Boolean(field.tags?.includes(tag));
}

export function fieldDisplayName(field: SchemaField) {
  return field.displayName ?? field.field;
}

export function hasOptions(o: { options: FieldOption[] | undefined | null }) {
  return (o.options?.length ?? 0) > 0;
}

export function defaultControlForField(
    sf: SchemaField,
): DataControlDefinition | GroupedControlsDefinition {
  if (isCompoundField(sf)) {
    return {
      type: ControlDefinitionType.Group,
      title: sf.displayName,
      compoundField: sf.field,
      groupOptions: {
        type: GroupRenderType.Grid,
        hideTitle: false,
      } as GridRenderer,
      children: sf.children.map(defaultControlForField),
    } satisfies GroupedControlsDefinition;
  } else if (isScalarField(sf)) {
    const htmlEditor = sf.tags?.includes("_HtmlEditor");
    return {
      type: ControlDefinitionType.Data,
      title: sf.displayName,
      field: sf.field,
      required: sf.required,
      renderOptions: {
        type: htmlEditor ? DataRenderType.HtmlEditor : DataRenderType.Standard,
      } 
    } satisfies DataControlDefinition;
  }
  throw "Unknown schema field";
}
function findReferencedControl(
    field: string,
    control: ControlDefinition,
): ControlDefinition | undefined {
  if (isDataControl(control) && field === control.field) return control;
  if (isGroupControl(control)) {
    if (control.compoundField)
      return field === control.compoundField ? control : undefined;
    return findReferencedControlInArray(field, control.children);
  }
  return undefined;
}

function findReferencedControlInArray(
    field: string,
    controls: ControlDefinition[],
): ControlDefinition | undefined {
  for (const c of controls) {
    const ref = findReferencedControl(field, c);
    if (ref) return ref;
  }
  return undefined;
}

export function addMissingControls(
    fields: SchemaField[],
    controls: ControlDefinition[],
): ControlDefinition[] {
  const changes: {
    field: SchemaField;
    existing: ControlDefinition | undefined;
  }[] = fields.flatMap((x) => {
    if (fieldHasTag(x, "_NoControl")) return [];
    const existing = findReferencedControlInArray(x.field, controls);
    if (!existing || isCompoundField(x)) return { field: x, existing };
    return [];
  });
  const changedCompounds = controls.map((x) => {
    const ex = changes.find((c) => c.existing === x);
    if (!ex) return x;
    const cf = x as GroupedControlsDefinition;
    return {
      ...cf,
      children: addMissingControls(
          (ex.field as CompoundField).children,
          cf.children,
      ),
    };
  });
  return changedCompounds.concat(
      changes
          .filter((x) => !x.existing)
          .map((x) => defaultControlForField(x.field)),
  );
}
