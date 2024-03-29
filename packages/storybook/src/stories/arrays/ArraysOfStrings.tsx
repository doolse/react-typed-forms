import {
  addElement,
  Finput,
  RenderElements,
  useControl,
  useControlEffect,
} from "@react-typed-forms/core";
import { useState } from "@storybook/preview-api";
import { PlainStory } from "@/index";

// language=text
const arraysOfStringsExampleCode = `
// Example code
export function ArraysOfStrings() {
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

export const ArraysOfStrings: PlainStory = {
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
            className="btn-primary"
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
