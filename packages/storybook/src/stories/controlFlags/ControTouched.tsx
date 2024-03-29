import { PlainStory } from "@/index";
import {
  Finput,
  formControlProps,
  useControl,
  useControlEffect,
} from "@react-typed-forms/core";
import { useState } from "@storybook/preview-api";

// language=text
const touchedExampleCode = `    
// Example code
export function ControlTouchedFlagExample() {
  const control = useControl("");
  const { onBlur } = formControlProps(control);

  return (
    <div className="container flex flex-col gap-2 text-surface-950">
      <div className="flex gap-2 items-center">
        <label>Input</label>
        {control.touched ? (
          <span className="badge-error">Touched</span>
        ) : (
          <span className="badge-success">Not Touched</span>
        )}
      </div>

      <Finput control={control} />
      <button
        className="btn-primary"
        onClick={(e) => {
          e.preventDefault();
          onBlur();
        }}
      >
        On Blur
      </button>
    </div>
  );
}
`;

export const ControlFlagsTouched: PlainStory = {
  parameters: {
    docs: {
      description: {
        story: `A control's <code>touched</code> flag generally gets set to true <code>onBlur()</code> and is generally used to prevent error messages from showing until the user has attempted to enter a value.`,
      },
      source: {
        language: "tsx",
        code: touchedExampleCode,
      },
    },
  },
  render: () => {
    const control = useControl("");
    const { onBlur } = formControlProps(control);

    // Internal usage
    const [_, setControlTouched] = useState(false);
    useControlEffect(
      () => control.touched,
      (v) => setControlTouched(v),
    );

    return (
      <div className="container flex flex-col gap-2 text-surface-950">
        <div className="flex gap-2 items-center">
          <label>Input</label>
          {control.touched ? (
            <span className="badge-error">Touched</span>
          ) : (
            <span className="badge-success">Not Touched</span>
          )}
        </div>

        <Finput control={control} />
        <button
          className="btn-primary"
          onClick={(e) => {
            e.preventDefault();
            onBlur();
          }}
        >
          On Blur
        </button>
      </div>
    );
  },
};
