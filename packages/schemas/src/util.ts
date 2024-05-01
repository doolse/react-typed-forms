import {
  CompoundField,
  ControlDefinition,
  ControlDefinitionType,
  DataControlDefinition,
  DataRenderType,
  DisplayOnlyRenderOptions,
  FieldOption,
  FieldType,
  GridRenderer,
  GroupedControlsDefinition,
  GroupRenderType,
  isDataControlDefinition,
  isDisplayOnlyRenderer,
  SchemaField,
  SchemaInterface,
  visitControlDefinition,
} from "./types";
import { MutableRefObject, useRef } from "react";
import { Control } from "@react-typed-forms/core";
import clsx from "clsx";

export interface ControlDataContext {
  groupControl: Control<any>;
  fields: SchemaField[];
  schemaInterface: SchemaInterface;
}
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

export function defaultValueForField(
  sf: SchemaField,
  required?: boolean | null,
): any {
  if (sf.defaultValue !== undefined) return sf.defaultValue;
  const isRequired = !!(required || sf.required);
  if (isCompoundField(sf)) {
    if (isRequired) {
      const childValue = defaultValueForFields(sf.children);
      return sf.collection ? [childValue] : childValue;
    }
    return sf.notNullable ? (sf.collection ? [] : {}) : undefined;
  }
  if (sf.collection) {
    return [];
  }
  return undefined;
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

export function defaultControlForField(sf: SchemaField): DataControlDefinition {
  if (isCompoundField(sf)) {
    return {
      type: ControlDefinitionType.Data,
      title: sf.displayName,
      field: sf.field,
      required: sf.required,
      children: sf.children.map(defaultControlForField),
    };
  } else if (isScalarField(sf)) {
    const htmlEditor = sf.tags?.includes("_HtmlEditor");
    return {
      type: ControlDefinitionType.Data,
      title: sf.displayName,
      field: sf.field,
      required: sf.required,
      renderOptions: {
        type: htmlEditor ? DataRenderType.HtmlEditor : DataRenderType.Standard,
      },
    };
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
    return findReferencedControlInArray(field, control.children ?? []);
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
        cf.children ?? [],
      ),
    };
  });
  return changedCompounds.concat(
    changes
      .filter((x) => !x.existing)
      .map((x) => defaultControlForField(x.field)),
  );
}

export function useUpdatedRef<A>(a: A): MutableRefObject<A> {
  const r = useRef(a);
  r.current = a;
  return r;
}

export function isControlReadonly(c: ControlDefinition): boolean {
  return isDataControl(c) && !!c.readonly;
}

export function getDisplayOnlyOptions(
  d: ControlDefinition,
): DisplayOnlyRenderOptions | undefined {
  return isDataControlDefinition(d) &&
    d.renderOptions &&
    isDisplayOnlyRenderer(d.renderOptions)
    ? d.renderOptions
    : undefined;
}

export function getTypeField(
  context: ControlDataContext,
): Control<string> | undefined {
  const typeSchemaField = context.fields.find((x) => x.isTypeField);
  return typeSchemaField
    ? context.groupControl.fields?.[typeSchemaField.field]
    : undefined;
}

export function visitControlDataArray<A>(
  controls: ControlDefinition[] | undefined | null,
  context: ControlDataContext,
  cb: (
    definition: DataControlDefinition,
    field: SchemaField,
    control: Control<any>,
    element: boolean,
  ) => A | undefined,
): A | undefined {
  if (!controls) return undefined;
  for (const c of controls) {
    const r = visitControlData(c, context, cb);
    if (r !== undefined) return r;
  }
  return undefined;
}

export function visitControlData<A>(
  definition: ControlDefinition,
  ctx: ControlDataContext,
  cb: (
    definition: DataControlDefinition,
    field: SchemaField,
    control: Control<any>,
    element: boolean,
  ) => A | undefined,
): A | undefined {
  return visitControlDefinition<A | undefined>(
    definition,
    {
      data(def: DataControlDefinition) {
        return processData(def, def.field, def.children);
      },
      group(d: GroupedControlsDefinition) {
        return processData(undefined, d.compoundField, d.children);
      },
      action: () => undefined,
      display: () => undefined,
    },
    () => undefined,
  );

  function processData(
    def: DataControlDefinition | undefined,
    fieldName: string | undefined | null,
    children: ControlDefinition[] | null | undefined,
  ) {
    const fieldData = fieldName ? findField(ctx.fields, fieldName) : undefined;
    if (!fieldData)
      return !fieldName ? visitControlDataArray(children, ctx, cb) : undefined;

    const control = ctx.groupControl.fields[fieldData.field];
    const result = def ? cb(def, fieldData, control, false) : undefined;
    if (result !== undefined) return result;
    if (fieldData.collection) {
      for (const c of control.elements ?? []) {
        const elemResult = def ? cb(def, fieldData, c, true) : undefined;
        if (elemResult !== undefined) return elemResult;
        if (isCompoundField(fieldData)) {
          const cfResult = visitControlDataArray(
            children,
            {
              fields: fieldData.children,
              groupControl: c,
              schemaInterface: ctx.schemaInterface,
            },
            cb,
          );
          if (cfResult !== undefined) return cfResult;
        }
      }
    }
  }
}

export function cleanDataForSchema(
  v: { [k: string]: any } | undefined,
  fields: SchemaField[],
): any {
  if (!v) return v;
  const typeField = fields.find((x) => x.isTypeField);
  if (!typeField) return v;
  const typeValue = v[typeField.field];
  const cleanableFields = fields.filter(
    (x) => isCompoundField(x) || (x.onlyForTypes?.length ?? 0) > 0,
  );
  if (!cleanableFields.length) return v;
  const out = { ...v };
  cleanableFields.forEach((x) => {
    const childValue = v[x.field];
    if (
      x.onlyForTypes?.includes(typeValue) === false ||
      (!x.notNullable && canBeNull())
    ) {
      delete out[x.field];
      return;
    }
    if (isCompoundField(x)) {
      const childFields = x.treeChildren ? fields : x.children;
      if (x.collection) {
        if (Array.isArray(childValue)) {
          out[x.field] = childValue.map((cv) =>
            cleanDataForSchema(cv, childFields),
          );
        }
      } else {
        out[x.field] = cleanDataForSchema(childValue, childFields);
      }
    }
    function canBeNull() {
      return (
        x.collection && Array.isArray(childValue) && !childValue.length
        //|| (x.type === FieldType.Bool && childValue === false)
      );
    }
  });
  return out;
}

export function getAllReferencedClasses(c: ControlDefinition): string[] {
  const childClasses = c.children?.flatMap(getAllReferencedClasses);
  const tc = clsx(c.styleClass, c.layoutClass);
  if (childClasses && !tc) return childClasses;
  if (!tc) return [];
  if (childClasses) return [tc, ...childClasses];
  return [tc];
}
