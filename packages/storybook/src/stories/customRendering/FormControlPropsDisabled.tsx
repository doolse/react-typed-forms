import { PlainStory, SimpleForm } from "@/index";
import {
  Control,
  Finput,
  formControlProps,
  RenderElements,
  useControl,
  useControlEffect,
} from "@react-typed-forms/core";
import React from "react";
import { useState } from "@storybook/preview-api";

//language=text
const formControlPropsPropsExampleCode = `
//Example code
interface SimpleForm {
  firstName: string;
  lastName: string;
}

function SimpleStructuredRow({
  state,
  index,
}: {
  state: Control<SimpleForm>;
  index: number;
}) {
  const c = state.fields;
  return (
    <div className={\`card-container-vertical max-w-fit gap-2 row_$\{index\}\`}>
      <div>
        <label className="mx-2">First:</label>
        <Finput
          type="text"
          className="firstField form-control"
          control={c.firstName}
        />
      </div>
      <div>
        <label className="mx-2">Last:</label>
        <Finput
          type="text"
          className="lastField form-control"
          control={c.lastName}
        />
      </div>
    </div>
  );
}

export function FormControlPropsDisabledExample() {
  const simpleStructure = useControl<SimpleForm[]>([
    { firstName: "First", lastName: "Last" },
    { firstName: "", lastName: "" },
    { firstName: "First 2", lastName: "Last 2" },
  ]);

  const { disabled } = formControlProps(simpleStructure);

  return (
    <div className="flex flex-col gap-4">
      {disabled ? (
        <div className="badge-error w-fit">Form disabled</div>
      ) : (
        <div className="badge-success w-fit">Form not disabled</div>
      )}
      <RenderElements control={simpleStructure}>
        {(x, idx) => (
          <SimpleStructuredRow state={x} key={x.uniqueId} index={idx} />
        )}
      </RenderElements>
      <div className="btn-group">
        <button
          className="btn-primary max-w-sm"
          onClick={(e) => {
            e.preventDefault();
            simpleStructure.disabled = !simpleStructure.current.disabled;
          }}
        >
          Toggle Disabled
        </button>
      </div>
    </div>
  );
}
`;
export const FormControlPropsDisabled: PlainStory = {
  parameters: {
    docs: {
      description: {
        story: "Disabled the `Control`, and prevent from any interactions",
      },
      source: {
        language: "tsx",
        code: formControlPropsPropsExampleCode,
      },
    },
  },
  render: () => {
    const simpleStructure = useControl<SimpleForm[]>([
      { firstName: "First", lastName: "Last" },
      { firstName: "", lastName: "" },
      { firstName: "First 2", lastName: "Last 2" },
    ]);

    const { disabled } = formControlProps(simpleStructure);

    // Internal usage
    const [_, setForceUpdate] = useState(false);
    useControlEffect(
      () => simpleStructure.disabled,
      () => setForceUpdate((x) => !x),
    );

    return (
      <div className="flex flex-col gap-4">
        {disabled ? (
          <div className="badge-error w-fit">Form disabled</div>
        ) : (
          <div className="badge-success w-fit">Form not disabled</div>
        )}
        <RenderElements control={simpleStructure}>
          {(x, idx) => (
            <SimpleStructuredRow state={x} key={x.uniqueId} index={idx} />
          )}
        </RenderElements>
        <div className="btn-group">
          <button
            className="btn-primary max-w-sm"
            onClick={(e) => {
              e.preventDefault();

              simpleStructure.disabled = !simpleStructure.current.disabled;
            }}
          >
            Toggle Disabled
          </button>
        </div>
      </div>
    );
  },
};

function SimpleStructuredRow({
  state,
  index,
}: {
  state: Control<SimpleForm>;
  index: number;
}) {
  const c = state.fields;
  return (
    <div className={`card-container-vertical max-w-fit gap-2 row_${index}`}>
      <div>
        <label className="mx-2">First:</label>
        <Finput
          type="text"
          className="firstField form-control"
          control={c.firstName}
        />
      </div>
      <div>
        <label className="mx-2">Last:</label>
        <Finput
          type="text"
          className="lastField form-control"
          control={c.lastName}
        />
      </div>
    </div>
  );
}
