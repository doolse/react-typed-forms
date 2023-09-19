import { DataControlProperties } from "./controlRender";

export interface SchemaField {
  type: string;
  field: string;
  displayName?: string | null;
  tags?: string[] | null;
  system?: boolean | null;
  collection?: boolean | null;
  onlyForTypes?: string[] | null;
  required?: boolean | null;
  defaultValue?: any;
  isTypeField?: boolean | null;
  searchable?: boolean | null;
  options?: FieldOption[] | null;
  /**
   * @deprecated Use options directly
   */
  restrictions?: SchemaRestrictions | undefined | null;
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

export interface EntityRefField extends SchemaField {
  type: FieldType.EntityRef;
  entityRefType: string;
  parentField: string;
}

export interface SchemaRestrictions {
  options?: FieldOption[] | null;
}

export interface FieldOption {
  name: string;
  value: any;
}

export interface CompoundField extends SchemaField {
  type: FieldType.Compound;
  children: SchemaField[];
  treeChildren?: boolean;
}

export type AnyControlDefinition =
  | DataControlDefinition
  | GroupedControlsDefinition
  | ActionControlDefinition
  | DisplayControlDefinition;

export interface ControlDefinition {
  type: string;
  title?: string | null;
  dynamic?: DynamicProperty[] | null;
  adornments?: ControlAdornment[] | null;
}

export enum ControlDefinitionType {
  Data = "Data",
  Group = "Group",
  Display = "Display",
  Action = "Action",
}

export interface DynamicProperty {
  type: string;
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
  required?: boolean | null;
  renderOptions?: RenderOptions | null;
  defaultValue?: any;
  readonly?: boolean | null;
}

export interface RenderOptions {
  type: string;
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
  format?: string | null;
}

export interface IconListRenderOptions extends RenderOptions {
  iconMappings: IconMapping[];
}

export interface IconMapping {
  value: string;
  materialIcon?: string | null;
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
  children: ControlDefinition[];
  compoundField?: string | null;
  groupOptions: GroupRenderOptions;
}

export interface GroupRenderOptions {
  type: GroupRenderType;
  hideTitle?: boolean | null;
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
  columns?: number | null;
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

export function isDataControlDefinition(
  x: ControlDefinition
): x is DataControlDefinition {
  return x.type === ControlDefinitionType.Data;
}

export function isGroupControlsDefinition(
  x: ControlDefinition
): x is GroupedControlsDefinition {
  return x.type === ControlDefinitionType.Group;
}

export function isDisplayControlsDefinition(
  x: ControlDefinition
): x is DisplayControlDefinition {
  return x.type === ControlDefinitionType.Display;
}

export function isActionControlsDefinition(
  x: ControlDefinition
): x is ActionControlDefinition {
  return x.type === ControlDefinitionType.Action;
}

export interface ControlVisitor<A> {
  data(d: DataControlDefinition): A;
  group(d: GroupedControlsDefinition): A;
  display(d: DisplayControlDefinition): A;
  action(d: ActionControlDefinition): A;
}

export function visitControlDefinition<A>(
  x: ControlDefinition,
  visitor: ControlVisitor<A>,
  defaultValue: (c: ControlDefinition) => A
): A {
  switch (x.type) {
    case ControlDefinitionType.Action:
      return visitor.action(x as ActionControlDefinition);
    case ControlDefinitionType.Data:
      return visitor.data(x as DataControlDefinition);
    case ControlDefinitionType.Display:
      return visitor.display(x as DisplayControlDefinition);
    case ControlDefinitionType.Group:
      return visitor.group(x as GroupedControlsDefinition);
    default:
      return defaultValue(x);
  }
}
