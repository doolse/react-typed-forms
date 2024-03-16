import React, { Key, ReactElement, ReactNode } from "react";
import {
  ActionControlDefinition,
  AdornmentPlacement,
  CompoundField,
  ControlAdornment,
  ControlDefinition,
  DataControlDefinition,
  DisplayData,
  FieldOption,
  FieldType,
  GridRenderer,
  GroupedControlsDefinition,
  GroupRenderOptions,
  isGridRenderer,
  RenderOptions,
  SchemaField,
} from "./types";
import { Control } from "@react-typed-forms/core";
import { ControlInput, GroupRendererRegistration } from "./renderers";
import clsx from "clsx";

export interface FormRenderer {
  renderData: (props: DataRendererProps) => ReactNode;
  renderGroup: (props: GroupRendererProps) => ReactNode;
  renderDisplay: (props: DisplayRendererProps) => ReactNode;
  renderAction: (props: ActionRendererProps) => ReactNode;
  renderArray: (props: ArrayRendererProps) => ReactNode;
  renderAdornment: (props: AdornmentProps) => AdornmentRenderer;
  renderTitle: (props: TitleRendererProps) => ReactNode;
  renderLayout: (props: ControlLayoutProps) => ReactNode;
}

export interface TitleRendererProps {
  title: ReactNode;
  forId?: string;
  required: boolean;
}

export interface AdornmentProps {
  key: Key;
  adornment: ControlAdornment;
}

export interface AdornmentRenderer {
  wrap?: (children: ReactNode) => ReactNode;
  child?: ReactNode;
  placement?: AdornmentPlacement;
}

export interface ArrayRendererProps {
  addAction?: ActionRendererProps;
  removeAction?: (childIndex: number) => ActionRendererProps;
  childCount: number;
  renderChild: (childIndex: number) => ReactElement;
  childKey: (childIndex: number) => Key;
}

export interface DisplayRendererProps {
  display: DisplayData;
}
export interface Visibility {
  visible: boolean;
  showing: boolean;
}

export interface ControlLayoutProps {
  visibility: Control<Visibility>;
  labelStart?: ReactNode;
  label?: ReactNode;
  labelEnd?: ReactNode;
  controlStart?: ReactNode;
  children?: ReactNode;
  controlEnd?: ReactNode;
  errorControl?: Control<any>;
}

export function DefaultLabelRenderer({
  className,
  labelClass,
  title,
  forId,
  required,
  children,
  group,
  hideTitle,
  groupLabelClass,
  renderAdornment,
  requiredElement,
}: LabelRendererProps &
  DefaultLabelRendererOptions & { children: ReactElement }) {
  return title && !hideTitle ? (
    <div className={className}>
      {renderAdornment(AdornmentPlacement.LabelStart)}
      <label
        htmlFor={forId}
        className={clsx(labelClass, group && groupLabelClass)}
      >
        {title}
        {required && requiredElement}
      </label>
      {renderAdornment(AdornmentPlacement.LabelEnd)}
      {renderAdornment(AdornmentPlacement.ControlStart)}
      {children}
      {renderAdornment(AdornmentPlacement.ControlEnd)}
    </div>
  ) : (
    <>{children}</>
  );
}

export interface GroupRendererProps {
  renderOptions: GroupRenderOptions;
  childCount: number;
  renderChild: (child: number) => ReactElement;
}

export interface DataRendererProps {
  renderOptions: RenderOptions;
  field: SchemaField;
  id: string;
  control: Control<any>;
  readonly: boolean;
  required: boolean;
  options: FieldOption[] | undefined | null;
}

export interface ActionRendererProps {
  actionId: string;
  actionText: string;
  onClick: () => void;
}

function testData(props: DataRendererProps) {
  return (
    <ControlInput
      id={props.id}
      readOnly={props.readonly}
      control={props.control}
      convert={createInputConversion(props.field.type)}
    />
  );
}

type InputConversion = [string, (s: any) => any, (a: any) => string | number];

export function createInputConversion(ft: string): InputConversion {
  switch (ft) {
    case FieldType.String:
      return ["text", (a) => a, (a) => a];
    case FieldType.Bool:
      return ["text", (a) => a === "true", (a) => a?.toString() ?? ""];
    case FieldType.Int:
      return [
        "number",
        (a) => (a !== "" ? parseInt(a) : null),
        (a) => (a == null ? "" : a),
      ];
    case FieldType.Date:
      return ["date", (a) => a, (a) => a];
    case FieldType.Double:
      return ["number", (a) => parseFloat(a), (a) => a];
    default:
      return ["text", (a) => a, (a) => a];
  }
}

function useControlLayout(c: ControlDefinition): ;
