import {
  ActionControlDefinition,
  CompoundField,
  ControlDefinition,
  ControlDefinitionType,
  DataControlDefinition,
  DisplayControlDefinition,
  FieldOption,
  GroupedControlsDefinition,
  ScalarField,
  SchemaField,
  SchemaFieldType,
} from "./types";
import React, { createContext, FC, Key, ReactElement, useContext } from "react";
import {
  AnyControl,
  Control,
  ControlChange,
  newControl,
  useControlChangeEffect,
} from "@react-typed-forms/core";

export type AnyControlDefinitions =
  | ControlDefinition
  | DataControlDefinition
  | GroupedControlsDefinition
  | DisplayControlDefinition;

export interface FormEditHooks {
  useDataProperties(
    formState: FormEditState,
    definition: DataControlDefinition,
    field: ScalarField
  ): DataControlProperties;
  useGroupProperties(
    formState: FormEditState,
    definition: GroupedControlsDefinition,
    currentHooks: FormEditHooks
  ): GroupControlProperties;
  useDisplayProperties(
    formState: FormEditState,
    definition: DisplayControlDefinition
  ): DisplayControlProperties;
  useActionProperties(
    formState: FormEditState,
    definition: ActionControlDefinition
  ): ActionControlProperties;
}

export interface DataControlProperties {
  visible: boolean;
  options: FieldOption[] | undefined;
  defaultValue: any;
  required: boolean;
  customRender?: (props: DataRendererProps) => ReactElement;
}

export interface GroupControlProperties {
  visible: boolean;
  hooks: FormEditHooks;
}

export interface DisplayControlProperties {
  visible: boolean;
}

export interface ActionControlProperties {
  visible: boolean;
  onClick: () => void;
}

export interface ControlData {
  [field: string]: any;
}

export interface FormEditState {
  fields: SchemaField[];
  data: Control<ControlData>;
}

export interface FormRendererComponents {
  RenderData: FC<DataRendererProps>;
  RenderGroup: FC<GroupRendererProps>;
  RenderCompound: FC<CompoundGroupRendererProps>;
  RenderDisplay: FC<DisplayRendererProps>;
  RenderAction: FC<ActionRendererProps>;
}

export const FormRendererComponentsContext = createContext<
  FormRendererComponents | undefined
>(undefined);

export function useFormRendererComponents() {
  const c = useContext(FormRendererComponentsContext);
  if (!c) {
    throw "Need to use FormRendererComponentContext.Provider";
  }
  return c;
}

export interface DisplayRendererProps {
  definition: DisplayControlDefinition;
  properties: DisplayControlProperties;
}

export interface ActionRendererProps {
  definition: ActionControlDefinition;
  properties: ActionControlProperties;
}

export interface DataRendererProps {
  definition: DataControlDefinition;
  properties: DataControlProperties;
  field: ScalarField;
  control: AnyControl;
  formEditState?: FormEditState;
}

export interface GroupRendererProps {
  definition: Omit<GroupedControlsDefinition, "children">;
  properties: GroupControlProperties;
  childCount: number;
  renderChild: (
    child: number,
    wrapChild: (key: Key, childElem: ReactElement) => ReactElement
  ) => ReactElement;
}

export interface CompoundGroupRendererProps {
  definition: GroupedControlsDefinition;
  field: CompoundField;
  control: AnyControl;
  properties: GroupControlProperties;
  renderChild: (
    key: Key,
    control: ControlDefinition,
    data: Control<{
      [field: string]: any;
    }>,
    wrapChild: (key: Key, childElem: ReactElement) => ReactElement
  ) => ReactElement;
}

export function isScalarField(sf: SchemaField): sf is ScalarField {
  return sf.schemaType === SchemaFieldType.Scalar;
}

export function isCompoundField(sf: SchemaField): sf is CompoundField {
  return sf.schemaType === SchemaFieldType.Compound;
}

export type AnySchemaFields =
  | SchemaField
  | ScalarField
  | (Omit<CompoundField, "children"> & { children: AnySchemaFields[] });

export function applyDefaultValues(
  v: { [k: string]: any } | undefined,
  fields: SchemaField[]
): any {
  if (!v) return defaultValueForFields(fields);
  const applyValue = fields.filter(
    (x) => x.schemaType === SchemaFieldType.Compound || !(x.field in v)
  );
  if (!applyValue.length) return v;
  const out = { ...v };
  applyValue.forEach((x) => {
    out[x.field] =
      x.field in v
        ? applyDefaultForField(v[x.field], x, fields)
        : defaultValueForField(x, true);
  });
  return out;
}

export function applyDefaultForField(
  v: any,
  field: SchemaField,
  parent: SchemaField[],
  notElement?: boolean
): any {
  if (field.collection && !notElement) {
    return ((v as any[]) ?? []).map((x) =>
      applyDefaultForField(x, field, parent, true)
    );
  }
  if (isCompoundField(field)) {
    return applyDefaultValues(v, field.treeChildren ? parent : field.children);
  }
  return defaultValueForField(field, true);
}

export function defaultValueForFields(fields: SchemaField[]): any {
  return Object.fromEntries(
    fields.map((x) => [x.field, defaultValueForField(x, true)])
  );
}

export function defaultValueForField(
  sf: SchemaField,
  notElement?: boolean
): any {
  if (notElement && sf.collection) return [];
  if (isCompoundField(sf)) {
    return defaultValueForFields(sf.children);
  }
  return (sf as ScalarField).defaultValue;
}

export function findScalarField(
  fields: SchemaField[],
  field: string
): ScalarField | undefined {
  return findField(fields, field) as ScalarField | undefined;
}

export function findCompoundField(
  fields: SchemaField[],
  field: string
): CompoundField | undefined {
  return findField(fields, field) as CompoundField | undefined;
}

export function findField(
  fields: SchemaField[],
  field: string
): SchemaField | undefined {
  return fields.find((x) => x.field === field);
}

export function fieldDisplayName(sf: SchemaField): string {
  return sf.displayName ? sf.displayName : sf.field;
}

export function controlTitle(title: string, field: SchemaField) {
  return title ? title : fieldDisplayName(field);
}

export function renderControl(
  definition: AnyControlDefinitions,
  formState: FormEditState,
  hooks: FormEditHooks,
  key: Key,
  wrapChild?: (key: Key, db: ReactElement) => ReactElement
): ReactElement {
  const { fields } = formState;
  switch (definition.type) {
    case ControlDefinitionType.Data:
      const def = definition as DataControlDefinition;
      const fieldData = findScalarField(fields, def.field);
      if (!fieldData) return <h1>No schema field for: {def.field}</h1>;
      return (
        <DataRenderer
          key={key}
          wrapElem={wrapElem}
          formState={formState}
          hooks={hooks}
          controlDef={def}
          fieldData={fieldData}
        />
      );
    case ControlDefinitionType.Group:
      return (
        <GroupRenderer
          key={key}
          hooks={hooks}
          groupDef={definition as GroupedControlsDefinition}
          formState={formState}
          wrapElem={wrapElem}
        />
      );
    case ControlDefinitionType.Display:
      return (
        <DisplayRenderer
          key={key}
          hooks={hooks}
          formState={formState}
          wrapElem={wrapElem}
          displayDef={definition as DisplayControlDefinition}
        />
      );
    case ControlDefinitionType.Action:
      return (
        <ActionRenderer
          key={key}
          hooks={hooks}
          formState={formState}
          wrapElem={wrapElem}
          actionDef={definition as ActionControlDefinition}
        />
      );
    default:
      return <h1>Unknown control: {definition.type}</h1>;
  }

  function wrapElem(e: ReactElement): ReactElement {
    return wrapChild?.(key, e) ?? e;
  }
}

function DataRenderer({
  hooks,
  formState,
  controlDef,
  wrapElem,
  fieldData,
}: {
  hooks: FormEditHooks;
  controlDef: DataControlDefinition;
  formState: FormEditState;
  fieldData: ScalarField;
  wrapElem: (db: ReactElement) => ReactElement;
}) {
  const { RenderData } = useFormRendererComponents();
  const props = hooks.useDataProperties(formState, controlDef, fieldData);
  const scalarControl =
    formState.data.fields[fieldData.field] ?? newControl(undefined);
  useControlChangeEffect(
    scalarControl,
    (c) => {
      if (props.defaultValue && !c.current.value) {
        c.value = props.defaultValue;
      }
    },
    ControlChange.Value,
    [scalarControl, props.defaultValue],
    true
  );
  if (!props.visible) {
    return <></>;
  }
  const scalarProps: DataRendererProps = {
    formEditState: formState,
    field: fieldData,
    control: scalarControl,
    definition: controlDef,
    properties: props,
  };
  return wrapElem(
    props.customRender?.(scalarProps) ?? <RenderData {...scalarProps} />
  );
}

function ActionRenderer({
  hooks,
  formState,
  wrapElem,
  actionDef,
}: {
  hooks: FormEditHooks;
  actionDef: ActionControlDefinition;
  formState: FormEditState;
  wrapElem: (db: ReactElement) => ReactElement;
}) {
  const { RenderAction } = useFormRendererComponents();
  const actionControlProperties = hooks.useActionProperties(
    formState,
    actionDef
  );
  if (!actionControlProperties.visible) {
    return <></>;
  }

  return wrapElem(
    <RenderAction definition={actionDef} properties={actionControlProperties} />
  );
}

function GroupRenderer({
  hooks,
  formState,
  groupDef,
  wrapElem,
}: {
  hooks: FormEditHooks;
  groupDef: GroupedControlsDefinition;
  formState: FormEditState;
  wrapElem: (db: ReactElement) => ReactElement;
}) {
  const { RenderCompound, RenderGroup } = useFormRendererComponents();

  const groupProps = hooks.useGroupProperties(formState, groupDef, hooks);
  if (!groupProps.visible) {
    return <></>;
  }
  const compoundField = groupDef.compoundField
    ? findCompoundField(formState.fields, groupDef.compoundField)
    : undefined;
  if (compoundField) {
    return wrapElem(
      <RenderCompound
        definition={groupDef}
        field={compoundField}
        control={formState.data.fields[compoundField.field]}
        properties={groupProps}
        renderChild={(k, c, data, wrapChild) =>
          renderControl(
            c as AnyControlDefinitions,
            {
              ...formState,
              fields: compoundField!.children,
              data,
            },
            groupProps.hooks,
            k,
            wrapChild
          )
        }
      />
    );
  }
  return wrapElem(
    <RenderGroup
      definition={groupDef}
      childCount={groupDef.children.length}
      properties={groupProps}
      renderChild={(c, wrapChild) =>
        renderControl(
          groupDef.children[c] as AnyControlDefinitions,
          formState,
          groupProps.hooks,
          c,
          wrapChild
        )
      }
    />
  );
}

function DisplayRenderer({
  hooks,
  wrapElem,
  formState,
  displayDef,
}: {
  hooks: FormEditHooks;
  displayDef: DisplayControlDefinition;
  formState: FormEditState;
  wrapElem: (db: ReactElement) => ReactElement;
}) {
  const { RenderDisplay } = useFormRendererComponents();

  const displayProps = hooks.useDisplayProperties(formState, displayDef);
  if (!displayProps.visible) {
    return <></>;
  }
  return wrapElem(
    <RenderDisplay definition={displayDef} properties={displayProps} />
  );
}
