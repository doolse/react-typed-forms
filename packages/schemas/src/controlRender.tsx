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
  GroupedControlsDefinition,
  GroupRenderOptions,
  RenderOptions,
  SchemaField,
  SchemaValidator,
  visitControlDefinition,
} from "./types";
import React, { Key, ReactElement, ReactNode } from "react";
import { Control, newControl } from "@react-typed-forms/core";
import {
  fieldDisplayName,
  findCompoundField,
  findField,
  findScalarField,
  isDataControl,
  isGroupControl,
} from "./util";

export interface SchemaHooks {
  useExpression(
    expr: EntityExpression,
    formState: FormEditState,
  ): Control<any | undefined>;
  useValidators(
    formState: FormEditState,
    isVisible: boolean | undefined,
    control: Control<any>,
    required: boolean,
    validations?: SchemaValidator[] | null,
  ): void;
}

export interface FormEditHooks {
  useDataProperties(
    formState: FormEditState,
    definition: DataControlDefinition,
    field: SchemaField,
  ): DataRendererProps;
  useGroupProperties(
    formState: FormEditState,
    definition: GroupedControlsDefinition,
  ): GroupRendererProps;
  useDisplayProperties(
    formState: FormEditState,
    definition: DisplayControlDefinition,
  ): DisplayRendererProps;
  useActionProperties(
    formState: FormEditState,
    definition: ActionControlDefinition,
  ): ActionRendererProps;
  schemaHooks: SchemaHooks;
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
  group?: GroupRendererProps;
}
export interface GroupRendererProps {
  definition: ControlDefinition;
  renderOptions: GroupRenderOptions;
  visible: Visibility;
  field?: CompoundField;
  array?: ArrayRendererProps;
  hideTitle: boolean;
  formState: FormEditState;
  childCount: number;
  renderChild: (child: number) => ReactElement;
}

export interface ControlData {
  [field: string]: any;
}

export interface FormDataContext {
  fields: SchemaField[];
  data: Control<ControlData>;
}
export interface FormEditState extends FormDataContext {
  hooks: FormEditHooks;
  renderer: FormRenderer;
  readonly?: boolean;
  invisible?: boolean;
}

export type RenderControlOptions = Omit<FormEditState, "data">;

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

export interface Visibility {
  value: boolean | undefined;
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

export type AnySchemaFields =
  | SchemaField
  | (Omit<CompoundField, "children"> & { children: AnySchemaFields[] });

export function controlTitle(
  title: string | undefined | null,
  field: SchemaField,
) {
  return title ? title : fieldDisplayName(field);
}

export function renderControl<S extends ControlDefinition>(
  definition: S,
  data: Control<any>,
  options: RenderControlOptions,
  key?: Key,
): ReactElement {
  const { fields } = options;
  const formState = { ...options, data };
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
            controlDef={def}
            fieldData={fieldData}
          />
        );
      },
      group: (d: GroupedControlsDefinition) => (
        <GroupRenderer key={key} groupDef={d} formState={formState} />
      ),
      action: (d: ActionControlDefinition) => (
        <ActionRenderer key={key} formState={formState} actionDef={d} />
      ),
      display: (d: DisplayControlDefinition) => (
        <DisplayRenderer key={key} formState={formState} displayDef={d} />
      ),
    },
    () => <h1>Unknown control: {(definition as any).type}</h1>,
  );
}

/** @trackControls */
function DataRenderer({
  formState,
  controlDef,
  fieldData,
}: {
  controlDef: DataControlDefinition;
  formState: FormEditState;
  fieldData: SchemaField;
}) {
  const props = formState.hooks.useDataProperties(
    formState,
    controlDef,
    fieldData,
  );
  return (props.customRender ?? formState.renderer.renderData)(props);
}

/** @trackControls */
function ActionRenderer({
  formState,
  actionDef,
}: {
  actionDef: ActionControlDefinition;
  formState: FormEditState;
}) {
  const actionControlProperties = formState.hooks.useActionProperties(
    formState,
    actionDef,
  );
  return formState.renderer.renderAction(actionControlProperties);
}

/** @trackControls */
function GroupRenderer({
  formState,
  groupDef,
}: {
  groupDef: GroupedControlsDefinition;
  formState: FormEditState;
}) {
  const groupProps = formState.hooks.useGroupProperties(formState, groupDef);
  return formState.renderer.renderGroup(groupProps);
}

/** @trackControls */
function DisplayRenderer({
  formState,
  displayDef,
}: {
  displayDef: DisplayControlDefinition;
  formState: FormEditState;
}) {
  const displayProps = formState.hooks.useDisplayProperties(
    formState,
    displayDef,
  );
  return formState.renderer.renderDisplay(displayProps);
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
  { fields, data }: FormDataContext,
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
        for (let c of d.children ?? []) {
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
