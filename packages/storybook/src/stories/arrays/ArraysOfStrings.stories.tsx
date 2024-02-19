import { Meta, StoryObj } from "@storybook/react";
import {
  addElement,
  Finput,
  RenderElements,
  useControl,
  useControlEffect,
} from "@react-typed-forms/core";
import { useState } from "@storybook/preview-api";

const meta: Meta<{}> = {
  title: "React typed forms/Arrays",
  component: undefined,
  parameters: {
    docs: {
      description: {
        component: `A <code>Control</code> containing an array can split each element out as it's own <code>Control</code> by using the <code>RenderElements</code> component.`,
      },
    },
  },
};

export default meta;
type Story = StoryObj<{}>;

// language=text
const arraysOfStringsExampleCode = `
// Example code
export function ListOfTextFields() {
  const textFields = useControl<string[]>([]);

  return (
    <div>
      <RenderElements
        control={textFields}
        children={(x) => <Finput control={x} />}
      />
      <button onClick={() => addElement(textFields, "")}>Add</button>
    </div>
  );
}
`;

export const ArraysOfStrings: Story = {
  parameters: {
    docs: {
      source: {
        language: "tsx",
        code: arraysOfStringsExampleCode,
      },
    },
  },
  render: () => {
    const textFields = useControl<string[]>([]);

    const [controlData, setControlData] = useState<string[]>([]);

    useControlEffect(
      () => textFields.value,
      (v) => setControlData(v),
    );

    return (
      <div className="flex flex-row gap-10 justify-center ">
        <div className="flex flex-col gap-2 flex-1">
          <RenderElements
            control={textFields}
            children={(x) => <Finput control={x} />}
          />
          <button
            className="px-4 py-2 rounded-full bg-primary-800 text-surface-100"
            onClick={() => addElement(textFields, "")}
          >
            Add
          </button>
        </div>

        {controlData && (
          <pre className="overflow-auto flex-1">
            {JSON.stringify(controlData, undefined, 2)}
          </pre>
        )}
      </div>
    );
  },
};

//language=text
const arraysOfStructuresExampleCode = `
// Example code
interface SimpleForm {
  firstName: string;
  lastName: string;
}

export function ListOfStructureFields() {
  const structureFields = useControl<SimpleForm[]>([]);

  return (
    <div className="flex flex-col gap-4 flex-1">
      <RenderElements
        control={structureFields}
        children={(x) => (
          <div className="bg-surface-100 rounded-lg flex flex-col gap-2 p-4">
            <label>First Name</label>
            <Finput id="firstName" type="text" control={x.fields.firstName} />
            <label>Last Name</label>
            <Finput id="lastName" type="text" control={x.fields.lastName} />
          </div>
        )}
      />
      <button
        className="px-4 py-2 rounded-full bg-primary-800 text-surface-100"
        onClick={() =>
          addElement(structureFields, { firstName: "", lastName: "" })
        }
      >
        Add
      </button>
    </div>
  );
}
`;

export const ArraysOfStructures: Story = {
  parameters: {
    docs: {
      source: {
        language: "tsx",
        code: arraysOfStructuresExampleCode,
      },
    },
  },
  render: () => {
    const structureFields = useControl<SimpleForm[]>([]);

    const [controlData, setControlData] = useState<SimpleForm[]>([]);

    useControlEffect(
      () => structureFields.value,
      (v) => setControlData(v),
    );

    return (
      <div className="flex flex-row gap-10 justify-center">
        <div className="flex flex-col gap-4 flex-1">
          <RenderElements
            control={structureFields}
            children={(x) => (
              <div className="bg-surface-100 rounded-lg flex flex-col gap-2 p-4">
                <label>First Name</label>
                <Finput
                  id="firstName"
                  type="text"
                  control={x.fields.firstName}
                />
                <label>Last Name</label>
                <Finput id="lastName" type="text" control={x.fields.lastName} />
              </div>
            )}
          />
          <button
            className="px-4 py-2 rounded-full bg-primary-800 text-surface-100"
            onClick={() =>
              addElement(structureFields, { firstName: "", lastName: "" })
            }
          >
            Add
          </button>
        </div>

        {controlData && (
          <pre className="overflow-auto flex-1">
            {JSON.stringify(controlData, undefined, 2)}
          </pre>
        )}
      </div>
    );
  },
};

export const SelectableArrays: Story = {
  render: () => {
    return <></>;
  },
};
