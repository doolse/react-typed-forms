import {
  ActionControlDefinition,
  AnyControlDefinition,
  CompoundField,
  ControlDefinition,
  ControlDefinitionType,
  DataControlDefinition,
  DisplayControlDefinition,
  EntityExpression,
  FieldOption,
  FieldType,
  GroupedControlsDefinition,
  SchemaField,
  visitControlDefinition,
} from "./types";
import React, {
  Context,
  createContext,
  Key,
  ReactElement,
  ReactNode,
  useContext,
} from "react";
import { Control, newControl } from "@react-typed-forms/core";
import { fieldDisplayName } from "./index";

export type ExpressionHook = (
  expr: EntityExpression,
  formState: FormEditState
) => any;

export interface FormEditHooks {
  useDataProperties(
    formState: FormEditState,
    definition: DataControlDefinition,
    field: SchemaField
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
  useExpression: ExpressionHook;
}

export interface DataControlProperties {
  control: Control<any>;
  visible: boolean;
  readonly: boolean;
  defaultValue: any;
  required: boolean;
  options: FieldOption[] | undefined | null;
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
  readonly?: boolean;
}

export interface FormRendererComponents {
  renderData: (
    props: DataRendererProps,
    control: Control<any>,
    element: boolean,
    renderers: FormRendererComponents
  ) => ReactElement;
  renderCompound: (
    props: CompoundGroupRendererProps,
    control: Control<any>,
    renderers: FormRendererComponents
  ) => ReactElement;
  renderGroup: (props: GroupRendererProps) => ReactElement;
  renderDisplay: (props: DisplayRendererProps) => ReactElement;
  renderAction: (props: ActionRendererProps) => ReactElement;
}

let _FormRendererComponentsContext: Context<
  FormRendererComponents | undefined
> | null = null;

function FormRendererComponentsContext() {
  if (!_FormRendererComponentsContext) {
    _FormRendererComponentsContext = createContext<
      FormRendererComponents | undefined
    >(undefined);
  }
  return _FormRendererComponentsContext;
}

export function FormRendererProvider({
  value,
  children,
}: {
  value: FormRendererComponents;
  children: ReactNode;
}) {
  const { Provider } = FormRendererComponentsContext();
  return <Provider value={value} children={children} />;
}

export function useFormRendererComponents() {
  const c = useContext(FormRendererComponentsContext());
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
  field: SchemaField;
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

export function isScalarField(sf: SchemaField): sf is SchemaField {
  return !isCompoundField(sf);
}

export function isCompoundField(sf: SchemaField): sf is CompoundField {
  return sf.type === FieldType.Compound;
}

export type AnySchemaFields =
  | SchemaField
  | (Omit<CompoundField, "children"> & { children: AnySchemaFields[] });

export function applyDefaultValues(
  v: { [k: string]: any } | undefined,
  fields: SchemaField[]
): any {
  if (!v) return defaultValueForFields(fields);
  const applyValue = fields.filter(
    (x) => isCompoundField(x) || !(x.field in v)
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
  notElement?: boolean
): any {
  if (field.collection && !notElement) {
    return ((v as any[]) ?? []).map((x) =>
      applyDefaultForField(x, field, parent, true)
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
    fields.map((x) => [x.field, defaultValueForField(x)])
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
  field: string
): SchemaField | undefined {
  return findField(fields, field);
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
export function controlTitle(
  title: string | undefined | null,
  field: SchemaField
) {
  return title ? title : fieldDisplayName(field);
}

export function renderControl<S extends ControlDefinition>(
  definition: S,
  formState: FormEditState,
  hooks: FormEditHooks,
  key: Key,
  wrapChild?: (key: Key, db: ReactElement) => ReactElement
): ReactElement {
  const { fields } = formState;
  return visitControlDefinition(
    definition,
    {
      data: (def) => {
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
      },
      group: (d: GroupedControlsDefinition) => (
        <GroupRenderer
          key={key}
          hooks={hooks}
          groupDef={d}
          formState={formState}
          wrapElem={wrapElem}
        />
      ),
      action: (d: ActionControlDefinition) => (
        <ActionRenderer
          key={key}
          hooks={hooks}
          formState={formState}
          wrapElem={wrapElem}
          actionDef={d}
        />
      ),
      display: (d: DisplayControlDefinition) => (
        <DisplayRenderer
          key={key}
          hooks={hooks}
          formState={formState}
          wrapElem={wrapElem}
          displayDef={d}
        />
      ),
    },
    () => <h1>Unknown control: {(definition as any).type}</h1>
  );

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
  fieldData: SchemaField;
  wrapElem: (db: ReactElement) => ReactElement;
}) {
  const renderer = useFormRendererComponents();
  const props = hooks.useDataProperties(formState, controlDef, fieldData);
  const scalarProps: DataRendererProps = {
    formEditState: formState,
    field: fieldData,
    definition: controlDef,
    properties: props,
  };
  return wrapElem(
    (props.customRender ?? renderer.renderData)(
      scalarProps,
      props.control,
      false,
      renderer
    )
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
  const { renderAction } = useFormRendererComponents();
  const actionControlProperties = hooks.useActionProperties(
    formState,
    actionDef
  );
  return wrapElem(
    renderAction({ definition: actionDef, properties: actionControlProperties })
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
  const renderers = useFormRendererComponents();

  const groupProps = hooks.useGroupProperties(formState, groupDef, hooks);
  const compoundField = groupDef.compoundField
    ? findCompoundField(formState.fields, groupDef.compoundField)
    : undefined;
  if (compoundField) {
    return wrapElem(
      renderers.renderCompound(
        {
          definition: groupDef,
          field: compoundField,
          properties: groupProps,
          renderChild: (k, c, data, wrapChild) =>
            renderControl(
              c as AnyControlDefinition,
              {
                ...formState,
                fields: compoundField!.children,
                data,
              },
              groupProps.hooks,
              k,
              wrapChild
            ),
        },
        formState.data.fields[compoundField.field],
        renderers
      )
    );
  }
  return wrapElem(
    renderers.renderGroup({
      definition: groupDef,
      childCount: groupDef.children.length,
      properties: groupProps,
      renderChild: (c, wrapChild) =>
        renderControl(
          groupDef.children[c],
          formState,
          groupProps.hooks,
          c,
          wrapChild
        ),
    })
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
  const { renderDisplay } = useFormRendererComponents();

  const displayProps = hooks.useDisplayProperties(formState, displayDef);
  return wrapElem(
    renderDisplay({ definition: displayDef, properties: displayProps })
  );
}

export function controlForField(
  field: string,
  formState: FormEditState
): Control<any> {
  const refField = findField(formState.fields, field);
  return (
    (refField && formState.data.fields[refField.field]) ?? newControl(undefined)
  );
}

export function fieldForControl(c: ControlDefinition) {
  return isDataControl(c)
    ? c.field
    : isGroupControl(c)
    ? c.compoundField
    : undefined;
}

export function isDataControl(
  c: ControlDefinition
): c is DataControlDefinition {
  return c.type === ControlDefinitionType.Data;
}

export function isGroupControl(
  c: ControlDefinition
): c is GroupedControlsDefinition {
  return c.type === ControlDefinitionType.Group;
}
