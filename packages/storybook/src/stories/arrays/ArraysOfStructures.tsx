import {
  addElement,
  Finput,
  RenderElements,
  useControl,
  useControlEffect,
} from "@react-typed-forms/core";
import { useState } from "@storybook/preview-api";
import { PlainStory, SimpleForm } from "@/index";

//language=text
const arraysOfStructuresExampleCode = `
// Example code
interface SimpleForm {
  firstName: string;
  lastName: string;
}

export function ArraysOfStructures() {
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
        className="bg-primary-800 text-surface-100 rounded-full py-2 px-4"
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

export const ArraysOfStructures: PlainStory = {
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
            className="btn-primary"
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
