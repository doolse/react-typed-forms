import { Finput, useControl, useControlEffect } from "@react-typed-forms/core";
import { Meta, StoryObj } from "@storybook/react";
import { useState } from "@storybook/preview-api";

// language=text
const exampleCode = `    
// Example code
const inputControl = useControl("text")
       
return (
    <div className="container flex flex-col gap-2 text-surface-950">
      <div className="flex gap-2 items-center">
        <label>Input</label>
        {inputControl.dirty ? (
          <span className="min-w-4 bg-danger-500 text-white px-4 py-1 rounded-full">
            Dirty
          </span>
        ) : (
          <span className="min-w-4 bg-success-500 text-white px-4 py-1 rounded-full">
            Not dirty
          </span>
        )}
      </div>
    
      <Finput control={inputControl} />
      <label>Control initial value: {inputControl.initialValue}</label>
      <label>Control current value: {inputControl.value}</label>
    </div>  
);  
`;

const meta: Meta<typeof Finput> = {
  title: "React typed forms/Basic/Control Flags/Dirty",
  component: Finput,
  decorators: [
    (story, params) => {
      const inputControl = useControl("text");

      //Internal side effect state
      const [dirty, setDirty] = useState<boolean>(inputControl.dirty);
      const [initialValue, setInitialValue] = useState(
        inputControl.initialValue,
      );
      const [currentValue, setCurrentValue] = useState(inputControl.value);

      useControlEffect(
        () => inputControl.value,
        (v) => {
          setInitialValue(inputControl.initialValue);
          setCurrentValue(v);
          setDirty(inputControl.dirty);
        },
      );

      return (
        <div className="container flex flex-col gap-2 text-surface-950">
          <div className="flex gap-2 items-center">
            <label>Input</label>
            {dirty ? (
              <span className="min-w-4 bg-danger-500 text-white px-4 py-1 rounded-full">
                Dirty
              </span>
            ) : (
              <span className="min-w-4 bg-success-500 text-white px-4 py-1 rounded-full">
                Not dirty
              </span>
            )}
          </div>

          <Finput control={inputControl} />
          <label>Control initial value: {initialValue}</label>
          <label>Control current value: {currentValue}</label>
        </div>
      );
    },
  ],
  parameters: {
    docs: {
      description: {
        component:
          "A control is dirty if the initialValue is not equal to the value",
      },
      source: {
        language: "tsx",
        code: exampleCode,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Finput>;

export const ControlFlagsDirty: Story = {
  render: () => <></>,
};
