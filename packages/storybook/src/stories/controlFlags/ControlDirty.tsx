import { Finput, useControl, useControlEffect } from "@react-typed-forms/core";
import { PlainStory } from "@/index";
import { useState } from "@storybook/preview-api";

// language=text
const dirtyExampleCode = `    
// Example code
export function ControlDirtyFlagExample() {
  const inputControl = useControl("text");

  return (
    <div className="container flex flex-col gap-2 text-surface-950">
      <div className="flex gap-2 items-center">
        <label>Input</label>
        {inputControl.dirty ? (
          <span className="badge-error">Dirty</span>
        ) : (
          <span className="badge-success">Not dirty</span>
        )}
      </div>

      <Finput control={inputControl} />
      <label>Control initial value: {inputControl.initialValue}</label>
      <label>Control current value: {inputControl.value}</label>
    </div>
  );
}
`;

export const ControlFlagsDirty: PlainStory = {
  parameters: {
    docs: {
      description: {
        story: `A control is <code>dirty</code> if the <code>initialValue</code> is not equal to the <code>value</code>`,
      },
      source: {
        language: "tsx",
        code: dirtyExampleCode,
      },
    },
  },
  render: () => {
    const inputControl = useControl("text");

    //Internal side effect state, use useState to force update
    const [_, setCurrentValue] = useState(inputControl.value);

    useControlEffect(
      () => inputControl.value,
      (v) => {
        setCurrentValue(v);
      },
    );

    return (
      <div className="container flex flex-col gap-2 text-surface-950">
        <div className="flex gap-2 items-center">
          <label>Input</label>
          {inputControl.dirty ? (
            <span className="badge-error">Dirty</span>
          ) : (
            <span className="badge-success">Not dirty</span>
          )}
        </div>

        <Finput control={inputControl} />
        <label>Control initial value: {inputControl.initialValue}</label>
        <label>Control current value: {inputControl.value}</label>
      </div>
    );
  },
};
