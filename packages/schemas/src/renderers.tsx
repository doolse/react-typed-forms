import { ReactElement } from "react";
import {
  DataRendererProps,
  FormRendererComponents,
  LabelRendererProps,
} from "./controlRender";

export interface DataRendererRegistration {
  type: "data";
  schemaType?: string | string[];
  renderType?: string | string[];
  collection?: boolean;
  match?: (props: DataRendererProps) => boolean;
  render: (
    props: DataRendererProps,
    withLabel: (element: ReactElement) => ReactElement,
    others: () => FormRendererComponents
  ) => ReactElement;
}

export interface LabelRendererRegistration {
  type: "label";
  render: (labelProps: LabelRendererProps) => ReactElement;
}

function createRenderer(
  data: DataRendererRegistration,
  label: LabelRendererRegistration
): FormRendererComponents {}
