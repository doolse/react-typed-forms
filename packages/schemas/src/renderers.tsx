import React, { Fragment, ReactElement } from "react";
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

export function createRenderer(
  data: DataRendererRegistration,
  label: LabelRendererRegistration
): FormRendererComponents {
  return {
    renderAction: (props) => <h1>Action</h1>,
    renderData: (props) => <h2>{props.definition.field}</h2>,
    renderGroup: (props) => {
      const { childCount, renderChild } = props;
      return (
        <div>
          {Array.from({ length: childCount }, (_, x) =>
            renderChild(x, (key, c) => <Fragment key={key} children={c} />)
          )}
        </div>
      );
    },
    renderLabel: (props) => <label>Label</label>,
    renderCompound: (props) => <div>Compound</div>,
    renderDisplay: (props) => <div>Display</div>,
  };
}
