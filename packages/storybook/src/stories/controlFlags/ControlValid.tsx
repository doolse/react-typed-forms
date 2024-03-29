import { PlainStory } from "@/index";
import { Finput, useControl, useControlEffect } from "@react-typed-forms/core";
import { useState } from "@storybook/preview-api";

// language=text
const validExampleCode = `    
// Example code
export function ControlValidFlagExample() {
  const control = useControl<number>(0, {
    validator: (v: number) =>
      v > 4 ? undefined : "Please enter a number greater than 4",
  });

  return (
    <div className="container flex flex-col gap-2 text-surface-950">
      <div className="flex gap-2 items-center">
        <label>Input</label>
        {control.valid ? (
          <span className="badge-success">Valid</span>
        ) : (
          <span className="badge-error">Not Valid</span>
        )}
      </div>

      <Finput control={control} />
      <div>Validator: Please enter a number greater than 4</div>
    </div>
  );
}
`;

export const ControlFlagsValid: PlainStory = {
  parameters: {
    docs: {
      description: {
        story: `A control is <code>valid</code> if it has an empty error message AND all of it's children controls are <code>valid</code>.`,
      },
      source: {
        language: "tsx",
        code: validExampleCode,
      },
    },
  },
  render: () => {
    const control = useControl<number>(0, {
      validator: (v: number) =>
        v > 4 ? undefined : "Please enter a number greater than 4",
    });

    const [_, setControlValid] = useState<boolean>(false);

    useControlEffect(
      () => control.valid,
      (v) => {
        setControlValid(v);
      },
    );

    return (
      <div className="container flex flex-col gap-2 text-surface-950">
        <div className="flex gap-2 items-center">
          <label>Input</label>
          {control.valid ? (
            <span className="badge-success">Valid</span>
          ) : (
            <span className="badge-error">Not Valid</span>
          )}
        </div>

        <Finput control={control} />
        <div>Validator: Please enter a number greater than 4</div>
      </div>
    );
  },
};
