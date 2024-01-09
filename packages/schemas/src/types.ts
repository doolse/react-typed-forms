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
  validators?: SchemaValidator[] | null;
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
  Any = "Any",
}

export interface EntityRefField extends SchemaField {
  type: FieldType.EntityRef;
  entityRefType: string;
  parentField: string;
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
  type: string;
}

export enum ExpressionType {
  Jsonata = "Jsonata",
  FieldValue = "FieldValue",
  UserMatch = "UserMatch",
}

export interface JsonataExpression extends EntityExpression {
  type: ExpressionType.Jsonata;
  expression: string;
}

export interface FieldValueExpression extends EntityExpression {
  type: ExpressionType.FieldValue;
  field: string;
  value: any;
}

export interface UserMatchExpression extends EntityExpression {
  type: ExpressionType.UserMatch;
  userMatch: string;
}

export interface ControlAdornment {
  type: string;
}

export enum AdornmentPlacement {
  ControlStart = "ControlStart",
  ControlEnd = "ControlEnd",
  LabelStart = "LabelStart",
  LabelEnd = "LabelEnd",
}

export enum ControlAdornmentType {
  Tooltip = "Tooltip",
  Accordion = "Accordion",
  HelpText = "HelpText",
}

export interface TooltipAdornment extends ControlAdornment {
  type: ControlAdornmentType.Tooltip;
  tooltip: string;
}

export interface AccordionAdornment extends ControlAdornment {
  type: ControlAdornmentType.Accordion;
  title: string;
  defaultExpanded: boolean;
}

export interface HelpTextAdornment extends ControlAdornment {
  type: ControlAdornmentType.HelpText;
  helpText: string;
  placement: AdornmentPlacement;
}

export interface DataControlDefinition extends ControlDefinition {
  type: ControlDefinitionType.Data;
  field: string;
  required?: boolean | null;
  renderOptions?: RenderOptions | null;
  defaultValue?: any;
  readonly?: boolean | null;
  validators?: SchemaValidator[] | null;
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
  Checkbox = "Checkbox",
  Dropdown = "Dropdown",
}

export interface RadioButtonRenderOptions extends RenderOptions {
  type: DataRenderType.Radio;
}

export interface StandardRenderer extends RenderOptions {
  type: DataRenderType.Standard;
}

export interface HtmlEditorRenderOptions extends RenderOptions {
  type: DataRenderType.HtmlEditor;
  allowImages: boolean;
}

export interface DateTimeRenderOptions extends RenderOptions {
  type: DataRenderType.DateTime;
  format?: string | null;
}

export interface IconListRenderOptions extends RenderOptions {
  type: DataRenderType.IconList;
  iconMappings: IconMapping[];
}

export interface IconMapping {
  value: string;
  materialIcon?: string | null;
}

export interface CheckListRenderOptions extends RenderOptions {
  type: DataRenderType.CheckList;
}

export interface SynchronisedRenderOptions extends RenderOptions {
  type: DataRenderType.Synchronised;
  fieldToSync: string;
  syncType: SyncTextType;
}

export enum SyncTextType {
  Camel = "Camel",
  Snake = "Snake",
  Pascal = "Pascal",
}

export interface UserSelectionRenderOptions extends RenderOptions {
  type: DataRenderType.UserSelection;
  noGroups: boolean;
  noUsers: boolean;
}

export interface IconSelectionRenderOptions extends RenderOptions {
  type: DataRenderType.IconSelector;
}

export interface GroupedControlsDefinition extends ControlDefinition {
  type: ControlDefinitionType.Group;
  children: ControlDefinition[];
  compoundField?: string | null;
  groupOptions: GroupRenderOptions;
}

export interface GroupRenderOptions {
  type: string;
  hideTitle?: boolean | null;
}

export enum GroupRenderType {
  Standard = "Standard",
  Grid = "Grid",
  GroupElement = "GroupElement",
}

export interface StandardGroupRenderer extends GroupRenderOptions {
  type: GroupRenderType.Standard;
}

export interface GroupElementRenderer extends GroupRenderOptions {
  type: GroupRenderType.GroupElement;
  value: any;
}

export interface GridRenderer extends GroupRenderOptions {
  type: GroupRenderType.Grid;
  columns?: number | null;
}

export interface DisplayControlDefinition extends ControlDefinition {
  type: ControlDefinitionType.Display;
  displayData: DisplayData;
}

export interface DisplayData {
  type: string;
}

export enum DisplayDataType {
  Text = "Text",
  Html = "Html",
}

export interface TextDisplay extends DisplayData {
  type: DisplayDataType.Text;
  text: string;
}

export interface HtmlDisplay extends DisplayData {
  type: DisplayDataType.Html;
  html: string;
}

export interface ActionControlDefinition extends ControlDefinition {
  type: ControlDefinitionType.Action;
  actionId: string;
}

export enum ValidatorType {
  Jsonata = "Jsonata",
  Date = "Date",
}
export interface SchemaValidator {
  type: string;
}

export interface JsonataValidator extends SchemaValidator {
  type: ValidatorType.Jsonata;
  expression: string;
}

export enum DateComparison {
  NotBefore = "NotBefore",
  NotAfter = "NotAfter",
}

export interface DateValidator extends SchemaValidator {
  type: ValidatorType.Date;
  comparison: DateComparison;
  fixedDate?: string | null;
  daysFromCurrent?: number | null;
}

export function isDataControlDefinition(
  x: ControlDefinition,
): x is DataControlDefinition {
  return x.type === ControlDefinitionType.Data;
}

export function isGroupControlsDefinition(
  x: ControlDefinition,
): x is GroupedControlsDefinition {
  return x.type === ControlDefinitionType.Group;
}

export function isDisplayControlsDefinition(
  x: ControlDefinition,
): x is DisplayControlDefinition {
  return x.type === ControlDefinitionType.Display;
}

export function isActionControlsDefinition(
  x: ControlDefinition,
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
  defaultValue: (c: ControlDefinition) => A,
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

export function dataControl(
  field: string,
  options?: Partial<DataControlDefinition>,
): DataControlDefinition {
  return { type: ControlDefinitionType.Data, field, ...options };
}

export function fieldValueExpr(
  field: string,
  value: any,
): FieldValueExpression {
  return { type: ExpressionType.FieldValue, field, value };
}

export function visibility(expr: EntityExpression): DynamicProperty {
  return { type: DynamicPropertyType.Visible, expr };
}

export function isGridRenderer(
  options: GroupRenderOptions,
): options is GridRenderer {
  return options.type === GroupRenderType.Grid;
}
