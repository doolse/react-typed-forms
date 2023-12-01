import {
  ActionControlDefinition,
  AdornmentPlacement,
  CompoundField,
  ControlAdornment,
  ControlDefinition,
  ControlDefinitionType,
  DataControlDefinition,
  DisplayControlDefinition,
  EntityExpression,
  FieldOption,
  FieldType,
  GroupedControlsDefinition,
  RenderOptions,
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
import { fieldDisplayName } from "./util";

export type ExpressionHook = (
  expr: EntityExpression,
  formState: FormEditState,
) => any;

export interface FormEditHooks {
  useDataProperties(
    formState: FormEditState,
    definition: DataControlDefinition,
    field: SchemaField,
    renderers: FormRenderer,
  ): DataRendererProps;
  useGroupProperties(
    formState: FormEditState,
    definition: GroupedControlsDefinition,
    currentHooks: FormEditHooks,
    renderers: FormRenderer,
  ): GroupRendererProps;
  useDisplayProperties(
    formState: FormEditState,
    definition: DisplayControlDefinition,
  ): DisplayRendererProps;
  useActionProperties(
    formState: FormEditState,
    definition: ActionControlDefinition,
  ): ActionRendererProps;
  useExpression: ExpressionHook;
}

export interface DataRendererProps {
  definition: DataControlDefinition;
  renderOptions: RenderOptions;
  visible: Visibility;
  control: Control<any>;
  field: SchemaField;
  array?: ArrayRendererProps;
  readonly: boolean;
  defaultValue: any;
  required: boolean;
  options: FieldOption[] | undefined | null;
  customRender?: (props: DataRendererProps) => ReactElement;
  formState: FormEditState;
}

export interface GroupRendererProps {
  definition: Omit<GroupedControlsDefinition, "children">;
  visible: Visibility;
  field?: CompoundField;
  array?: ArrayRendererProps;
  hideTitle: boolean;
  hooks: FormEditHooks;
  childCount: number;
  renderChild: (child: number) => ReactElement;
}

export interface ControlData {
  [field: string]: any;
}

export interface FormEditState {
  fields: SchemaField[];
  data: Control<ControlData>;
  readonly?: boolean;
  invisible?: boolean;
}

export interface ArrayRendererProps {
  definition: DataControlDefinition | GroupedControlsDefinition;
  control: Control<any[]>;
  field: SchemaField;
  addAction?: ActionRendererProps;
  removeAction?: (childCount: number) => ActionRendererProps;
  childCount: number;
  renderChild: (childCount: number) => ReactElement;
  childKey: (childCount: number) => Key;
}

export interface AdornmentProps {
  key: Key;
  definition: ControlAdornment;
}

export interface AdornmentRenderer {
  wrap?: (children: ReactElement) => ReactElement;
  child?: [AdornmentPlacement, ReactNode];
}

export interface FormRenderer {
  renderData: (props: DataRendererProps) => ReactElement;
  renderGroup: (props: GroupRendererProps) => ReactElement;
  renderDisplay: (props: DisplayRendererProps) => ReactElement;
  renderAction: (props: ActionRendererProps) => ReactElement;
  renderArray: (props: ArrayRendererProps) => ReactElement;
  renderLabel: (props: LabelRendererProps, elem: ReactElement) => ReactElement;
  renderVisibility: (visible: Visibility, elem: ReactElement) => ReactElement;
  renderAdornment: (props: AdornmentProps) => AdornmentRenderer;
}

let _FormRendererComponentsContext: Context<FormRenderer | undefined> | null =
  null;

function FormRendererComponentsContext() {
  if (!_FormRendererComponentsContext) {
    _FormRendererComponentsContext = createContext<FormRenderer | undefined>(
      undefined,
    );
  }
  return _FormRendererComponentsContext;
}

export function FormRendererProvider({
  value,
  children,
}: {
  value: FormRenderer;
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

export interface Visibility {
  value: boolean;
  canChange: boolean;
}
export interface LabelRendererProps {
  visible: Visibility;
  title?: ReactNode;
  forId?: string;
  required: boolean;
  control?: Control<any>;
  group?: boolean;
  renderAdornment: (placement: AdornmentPlacement) => ReactElement;
}

export interface DisplayRendererProps {
  definition: DisplayControlDefinition;
  visible: Visibility;
}

export interface ActionRendererProps {
  definition: ActionControlDefinition;
  visible: Visibility;
  onClick: () => void;
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
export function controlTitle(
  title: string | undefined | null,
  field: SchemaField,
) {
  return title ? title : fieldDisplayName(field);
}

export function renderControl<S extends ControlDefinition>(
  definition: S,
  formState: FormEditState,
  hooks: FormEditHooks,
  key: Key,
): ReactElement {
  const { fields } = formState;
  return visitControlDefinition(
    definition,
    {
      data: (def) => {
        const fieldData = findScalarField(fields, def.field);
        if (!fieldData)
          return <h1 key={key}>No schema field for: {def.field}</h1>;
        return (
          <DataRenderer
            key={key}
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
        />
      ),
      action: (d: ActionControlDefinition) => (
        <ActionRenderer
          key={key}
          hooks={hooks}
          formState={formState}
          actionDef={d}
        />
      ),
      display: (d: DisplayControlDefinition) => (
        <DisplayRenderer
          key={key}
          hooks={hooks}
          formState={formState}
          displayDef={d}
        />
      ),
    },
    () => <h1>Unknown control: {(definition as any).type}</h1>,
  );
}

/** @trackControls */
function DataRenderer({
  hooks,
  formState,
  controlDef,
  fieldData,
}: {
  hooks: FormEditHooks;
  controlDef: DataControlDefinition;
  formState: FormEditState;
  fieldData: SchemaField;
}) {
  const renderer = useFormRendererComponents();
  const props = hooks.useDataProperties(
    formState,
    controlDef,
    fieldData,
    renderer,
  );
  return (props.customRender ?? renderer.renderData)(props);
}

/** @trackControls */
function ActionRenderer({
  hooks,
  formState,
  actionDef,
}: {
  hooks: FormEditHooks;
  actionDef: ActionControlDefinition;
  formState: FormEditState;
}) {
  const { renderAction } = useFormRendererComponents();
  const actionControlProperties = hooks.useActionProperties(
    formState,
    actionDef,
  );
  return renderAction(actionControlProperties);
}

/** @trackControls */
function GroupRenderer({
  hooks,
  formState,
  groupDef,
}: {
  hooks: FormEditHooks;
  groupDef: GroupedControlsDefinition;
  formState: FormEditState;
}) {
  const renderers = useFormRendererComponents();
  const groupProps = hooks.useGroupProperties(
    formState,
    groupDef,
    hooks,
    renderers,
  );
  return renderers.renderGroup(groupProps);
}

/** @trackControls */
function DisplayRenderer({
  hooks,
  formState,
  displayDef,
}: {
  hooks: FormEditHooks;
  displayDef: DisplayControlDefinition;
  formState: FormEditState;
}) {
  const { renderDisplay } = useFormRendererComponents();
  const displayProps = hooks.useDisplayProperties(formState, displayDef);
  return renderDisplay(displayProps);
}

export function controlForField(
  field: string,
  formState: FormEditState,
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
  c: ControlDefinition,
): c is DataControlDefinition {
  return c.type === ControlDefinitionType.Data;
}

export function isGroupControl(
  c: ControlDefinition,
): c is GroupedControlsDefinition {
  return c.type === ControlDefinitionType.Group;
}

export const AlwaysVisible: Visibility = { value: true, canChange: false };

export function createAction(
  label: string,
  onClick: () => void,
  actionId?: string,
): ActionRendererProps {
  return {
    definition: {
      type: ControlDefinitionType.Action,
      actionId: actionId ?? label,
      title: label,
    },
    visible: AlwaysVisible,
    onClick,
  };
}

export function visitControlData<S extends ControlDefinition, A>(
  definition: S,
  { fields, data }: FormEditState,
  cb: (
    definition: DataControlDefinition,
    control: Control<any>,
  ) => A | undefined,
): A | undefined {
  return visitControlDefinition<A | undefined>(
    definition,
    {
      data(def: DataControlDefinition) {
        const fieldData = findScalarField(fields, def.field);
        if (!fieldData) return undefined;
        return cb(def, data.fields[fieldData.field]);
      },
      group(d: GroupedControlsDefinition) {
        if (d.compoundField) {
          const compound = findCompoundField(fields, d.compoundField);
          if (!compound) return;
          fields = compound.children;
          data = data.fields[compound.field];
        }
        const childState = { fields, data };
        for (let c of d.children) {
          const res = visitControlData(c, childState, cb);
          if (res !== undefined) return res;
        }
        return undefined;
      },
      action(d: ActionControlDefinition) {
        return undefined;
      },
      display(d: DisplayControlDefinition) {
        return undefined;
      },
    },
    () => undefined,
  );
}
