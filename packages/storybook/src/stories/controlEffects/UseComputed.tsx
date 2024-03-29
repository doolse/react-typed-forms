import { PlainStory, SimpleForm } from "@/index";
import {
  addElement,
  Finput,
  removeElement,
  RenderElements,
  useComputed,
  useControl,
  useControlEffect,
} from "@react-typed-forms/core";
import { useState } from "@storybook/preview-api";

const useComputedDescription = `
**Derive a \`Control\` value from a \`Control\` through a \`computed\` function**

> \`compute\` - A function which calculates a value and return its \`Control\`
`;

// language=text
const useComputedExampleCode = `
// Example code
export function UseComputedExample() {
  const structureFields = useControl<SimpleForm[]>([]);

  const computedFields = useComputed(() =>
    structureFields.value.filter((x) => x.firstName.length > 4),
  );

  const [controlData, setControlData] = useState<SimpleForm[]>([]);

  useControlEffect(
    () => computedFields.value,
    (v) => setControlData(v),
  );

  return (
    <div className="flex flex-row gap-10 justify-center">
      <div className="flex flex-col gap-4 flex-1">
        <h2>
          To filter a list of controls with first names longer than 4
          characters.
        </h2>
        <RenderElements
          control={structureFields}
          children={(x) => (
            <div className="bg-surface-100 rounded-lg flex flex-col gap-2 p-4">
              <label>First Name</label>
              <Finput id="firstName" type="text" control={x.fields.firstName} />
              <label>Last Name</label>
              <Finput id="lastName" type="text" control={x.fields.lastName} />
              <button
                className="btn-primary"
                onClick={() => removeElement(structureFields, x)}
              >
                Delete
              </button>
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
}
`;

export const UseComputed: PlainStory = {
  parameters: {
    docs: {
      description: {
        story: useComputedDescription,
      },
      source: {
        language: "tsx",
        code: useComputedExampleCode,
      },
    },
  },
  render: () => {
    const structureFields = useControl<SimpleForm[]>([]);

    const computedFields = useComputed(() =>
      structureFields.value.filter((x) => x.firstName.length > 4),
    );

    const [controlData, setControlData] = useState<SimpleForm[]>([]);

    useControlEffect(
      () => computedFields.value,
      (v) => setControlData(v),
    );

    return (
      <div className="flex flex-row gap-10 justify-center">
        <div className="flex flex-col gap-4 flex-1">
          <h2>
            To filter a list of controls with first names longer than 4
            characters.
          </h2>
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
                <button
                  className="btn-primary"
                  onClick={() => removeElement(structureFields, x)}
                >
                  Delete
                </button>
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
