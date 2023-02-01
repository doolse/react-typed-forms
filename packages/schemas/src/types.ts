export interface SchemaField {
  schemaType: SchemaFieldType;
  field: string;
  displayName: string;
  type: FieldType;
  tags: string[];
  system: boolean;
  collection: boolean;
  onlyForTypes: string[];
  required: boolean;
}

export enum SchemaFieldType {
  Scalar = "Scalar",
  Compound = "Compound",
}

export enum FieldType {
  String = "String",
  Bool = "Bool",
  Int = "Int",
  Date = "Date",
  DateTime = "DateTime",
  Double = "Double",
  EntityRef = "EntityRef",
  Compound = "Compound",
  AutoId = "AutoId",
  Image = "Image",
}

export interface ScalarField extends SchemaField {
  entityRefType: string;
  parentField: string;
  searchable: boolean;
  defaultValue: any;
  isTypeField: boolean;
  restrictions: SchemaRestrictions | undefined;
}

export interface SchemaRestrictions {
  options: FieldOption[] | undefined;
}

export interface FieldOption {
  name: string;
  value: any;
}

export interface CompoundField extends SchemaField {
  children: SchemaField[];
  treeChildren: boolean;
}

export type AnyControlDefinition =
  | DataControlDefinition
  | GroupedControlsDefinition
  | ActionControlDefinition
  | DisplayControlDefinition;

export interface ControlDefinition {
  type: string;
  title?: string;
  dynamic?: DynamicProperty[];
  adornments?: ControlAdornment[];
}

export enum ControlDefinitionType {
  Data = "Data",
  Group = "Group",
  Display = "Display",
  Action = "Action",
}

export interface DynamicProperty {
  type: DynamicPropertyType;
  expr: EntityExpression;
}

export enum DynamicPropertyType {
  Visible = "Visible",
  DefaultValue = "DefaultValue",
}

export interface EntityExpression {
  type: ExpressionType;
}

export enum ExpressionType {
  Jsonata = "Jsonata",
  FieldValue = "FieldValue",
  UserMatch = "UserMatch",
}

export interface JsonataExpression extends EntityExpression {
  expression: string;
}

export interface FieldValueExpression extends EntityExpression {
  field: string;
  value: any;
}

export interface UserMatchExpression extends EntityExpression {
  userMatch: string;
}

export interface ControlAdornment {
  type: ControlAdornmentType;
}

export enum ControlAdornmentType {
  Tooltip = "Tooltip",
  Accordion = "Accordion",
}

export interface TooltipAdornment extends ControlAdornment {
  tooltip: string;
}

export interface AccordionAdornment extends ControlAdornment {
  title: string;
  defaultExpanded: boolean;
}

export interface DataControlDefinition extends ControlDefinition {
  type: ControlDefinitionType.Data;
  field: string;
  required?: boolean;
  renderOptions: RenderOptions;
  defaultValue?: any;
  readonly?: boolean;
}

export interface RenderOptions {
  type: DataRenderType;
}

export enum DataRenderType {
  Standard = "Standard",
  Radio = "Radio",
  HtmlEditor = "HtmlEditor",
  IconList = "IconList",
  CheckList = "CheckList",
  UserSelection = "UserSelection",
  Synchronised = "Synchronised",
  IconSelector = "IconSelector",

  DateTime = "DateTime",
}

export interface RadioButtonRenderOptions extends RenderOptions {}

export interface StandardRenderer extends RenderOptions {}

export interface HtmlEditorRenderOptions extends RenderOptions {
  allowImages: boolean;
}

export interface DateTimeRenderOptions extends RenderOptions {
  format?: string;
}

export interface IconListRenderOptions extends RenderOptions {
  iconMappings: IconMapping[];
}

export interface IconMapping {
  value: string;
  materialIcon: string | undefined;
}

export interface CheckListRenderOptions extends RenderOptions {}

export interface SynchronisedRenderOptions extends RenderOptions {
  fieldToSync: string;
  syncType: SyncTextType;
}

export enum SyncTextType {
  Camel = "Camel",
  Snake = "Snake",
  Pascal = "Pascal",
}

export interface UserSelectionRenderOptions extends RenderOptions {
  noGroups: boolean;
  noUsers: boolean;
}

export interface IconSelectionRenderOptions extends RenderOptions {}

export interface GroupedControlsDefinition extends ControlDefinition {
  type: ControlDefinitionType.Group;
  children: AnyControlDefinition[];
  compoundField?: string;
  groupOptions: GroupRenderOptions;
}

export interface GroupRenderOptions {
  type: GroupRenderType;
  hideTitle?: boolean;
}

export enum GroupRenderType {
  Standard = "Standard",
  Grid = "Grid",
  GroupElement = "GroupElement",
}

export interface StandardGroupRenderer extends GroupRenderOptions {}

export interface GroupElementRenderer extends GroupRenderOptions {
  value: any;
}

export interface GridRenderer extends GroupRenderOptions {
  columns: number | undefined;
}

export interface DisplayControlDefinition extends ControlDefinition {
  type: ControlDefinitionType.Display;
  displayData: DisplayData;
}

export interface DisplayData {
  type: DisplayDataType;
}

export enum DisplayDataType {
  Text = "Text",
  Html = "Html",
}

export interface TextDisplay extends DisplayData {
  text: string;
}

export interface HtmlDisplay extends DisplayData {
  html: string;
}

export interface ActionControlDefinition extends ControlDefinition {
  type: ControlDefinitionType.Action;
  actionId: string;
}
