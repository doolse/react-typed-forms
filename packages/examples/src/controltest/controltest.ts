import {
  ArrayControl,
  arrayControl,
  buildGroup,
  control,
  ControlType,
  GroupControl,
  GroupControlFields,
} from "@react-typed-forms/core";
import { useMemo, useState } from "react";

export interface ExportDefinitionSummary {
  id: string;
  shortName: string;
  name: string;
}

export type AllExportColumns = DirectColumn &
  MappedColumn &
  DateTimeColumn &
  RepeatedColumns &
  AddressColumn &
  CaseChangeColumn;

export enum AddressMappingType {
  LGA = 0,
  Street = 1,
  Suburb = 2,
  State = 3,
  Postcode = 4,
}

const MappingFormDef = buildGroup<MappedValue>()({ mapped: "", original: "" });

const BaseExportColumnFormDef = buildGroup<
  Omit<AllExportColumns, "children">
>()({
  name: "",
  type: "",
  metadataKey: "",
  defaultValue: "",
  addressPart: AddressMappingType.Street,
  date: false,
  time: false,
  format: "",
  mapping: arrayControl(MappingFormDef),
  repeats: 1,
  upper: true,
  startIndex: 1,
});

export type ExportColumnForm = GroupControl<
  GroupControlFields<ControlType<typeof BaseExportColumnFormDef>> & {
    children: ArrayControl<ExportColumnForm>;
  }
>;

export const ExportColumnFormDef: () => ExportColumnForm = () =>
  BaseExportColumnFormDef().addFields({
    children: new ArrayControl(ExportColumnFormDef),
  });

export interface ExportColumn {
  name?: string | undefined;
  metadataKey?: string | undefined;
  type: string;
}

export interface DirectColumn extends ExportColumn {}

export interface DateTimeColumn extends ExportColumn {
  date?: boolean;
  time?: boolean;
  format?: string | undefined;
}

export interface RepeatedColumns extends ExportColumn {
  repeats?: number;
  startIndex?: number | undefined;
  children?: ExportColumn[] | undefined;
}

export interface AddressColumn extends ExportColumn {
  addressPart?: AddressMappingType;
}

export interface MappedColumn extends ExportColumn {
  mapping?: MappedValue[] | undefined;
  defaultValue?: string | undefined;
}

export interface MappedValue {
  original?: string | undefined;
  mapped?: string | undefined;
}

export interface ExposureSiteColumn extends ExportColumn {}

export interface CaseChangeColumn extends ExportColumn {
  upper?: boolean;
}

export enum ExportDefinitionType {
  Export = 0,
  Import = 1,
}

export enum QueueWorkItemStatus {
  New = 0,
  OnHold = 1,
  InProgress = 2,
  Closed = 3,
}

export enum DatePresets {
  Today = 0,
  Yesterday = 1,
  ThisWeek = 2,
  ThisMonth = 3,
  ThisYear = 4,
  LastWeek = 5,
  LastYear = 6,
  Custom = 7,
}

export interface PersonExportResults {
  total: number;
  results: PersonExport[];
}

export interface PersonExport {
  firstName: string;
  lastName: string;
  contactNumber: string;
  status: string;
  isDuplicate: boolean;
  qwiid: string;
  workItemId: string;
  personMatch?: string | undefined;
}

export interface ExportSearchQuery {
  queueId: string;
  status: QueueWorkItemStatus[];
  startDate?: string | undefined;
  endDate?: string | undefined;
  changeStatusTo?: QueueWorkItemStatus | undefined;
  questionnaireId?: string | undefined;
  queueOutcomes: string[];
  columns: ExportColumn[];
}

export interface QueueViewModel {
  id: string;
  name: string;
  canCreateForm: boolean;
  launchForm: boolean;
  formCreateHelpText?: string | undefined;
  canExportCSV: boolean;
  defaultExportQuestionnaireId?: string | undefined;
  showDateRangeFilter: boolean;
  showDuplicateFilter: boolean;
  useGP: boolean;
  useTNDSS: boolean;
  exportDefs?: ExportDefinitionSummary[] | undefined;
  showManageOutcomesOnClose: boolean;
}

interface ExportPageState extends ExportSearchQuery {
  people: PersonExportResults | undefined;
  queues: QueueViewModel[] | undefined;
  preset: string;
  isPublic: boolean;
  createdBy: string;
  rangePreset: DatePresets;
}

const FormDef = buildGroup<ExportPageState>()({
  people: undefined,
  queues: undefined,
  queueId: control("", (v) => (!v ? "Must select a queue" : undefined)),
  status: control([QueueWorkItemStatus.New], undefined, compareAsSet),
  startDate: "",
  endDate: "",
  changeStatusTo: control(undefined),
  questionnaireId: "",
  createdBy: "",
  columns: arrayControl(ExportColumnFormDef),
  preset: "",
  isPublic: false,
  queueOutcomes: control([], undefined, compareAsSet),
  rangePreset: DatePresets.Custom,
});

export function compareAsSet(a: any[], b: any[]) {
  return (
    a === b ||
    (a && b && a.length === b.length && a.every((e) => b.includes(e)))
  );
}

const [form] = useState(FormDef);
const queryGroup = useMemo(
  () =>
    form.subGroup(
      ({
        changeStatusTo,
        startDate,
        endDate,
        status,
        queueId,
        columns,
        queueOutcomes,
        questionnaireId,
        rangePreset,
      }) => ({
        startDate,
        endDate,
        status,
        queueId,
        columns,
        queueOutcomes,
        changeStatusTo,
        questionnaireId,
        rangePreset,
      })
    ),
  [form]
);
