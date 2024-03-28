import { PlainStory } from "@/index";
import {
  Finput,
  useControl,
  useControlEffect,
  useValueChangeEffect,
} from "@react-typed-forms/core";
import React from "react";
import { useState } from "@storybook/preview-api";

const useValueChangeEffectDescription = `
**Delay the execution of running effects based when the value of the control changes.**

> \`control\` - If the control value ever changes (equality is a shallow equals), the \`changeEffect\` is called.

>\`changeEffect\` - The effect to run when the control value changes.

>\`debounce\` \`Optional\` - The delay time in milliseconds. After this amount of time, the latest value is used.

>\`runInitial\` \`Optional\` - If \`true\` the \`changeEffect\` handler will run first time.
`;
//language=text
const useValueChangeEffectExampleCode = `
// Example code
export function UseValueChangeEffectExample() {
  const control = useControl("");
  const debounce = useControl(500);
  
  useValueChangeEffect(control, (v) => alert(v), debounce.value);

  return (
    <div className="flex flex-col gap-4">
      <h2>
        As you run the above example, you might notice when you switch on the
        show alert, and it will show the alert dialog each time you change input
        value.
      </h2>
      <div>
        You can use useValueChangeEffect to add a debounce time to solve this
        problem.
      </div>

      <div className="flex gap-4">
        <div className="flex flex-col gap-2">
          <h2>Alert content:</h2>
          <Finput className="w-fit" control={control} />
        </div>
        <div className="flex flex-col gap-2">
          <h2>Debounce:</h2>
          <Finput className="w-fit" control={debounce} type="number" />
        </div>
      </div>
    </div>
  );
}
`;
export const UseValueChangeEffect: PlainStory = {
  parameters: {
    docs: {
      description: {
        story: useValueChangeEffectDescription,
      },
      source: {
        language: "tsx",
        code: useValueChangeEffectExampleCode,
      },
    },
  },
  render: () => {
    const control = useControl("");
    const debounce = useControl(500);

    useValueChangeEffect(control, (v) => alert(v), debounce.value);

    // Internal usage
    const [_, setForceUpdate] = useState(false);
    useControlEffect(
      () => debounce.value,
      () => setForceUpdate((x) => !x),
    );

    return (
      <div className="flex flex-col gap-4">
        <h2>
          As you run the above example, you might notice when you switch on the
          show alert, and it will show the alert dialog each time you change
          input value.
        </h2>
        <div>
          You can use useValueChangeEffect to add a debounce time to solve this
          problem.
        </div>

        <div className="flex gap-4">
          <div className="flex flex-col gap-2">
            <h2>Alert content:</h2>
            <Finput className="w-fit" control={control} />
          </div>
          <div className="flex flex-col gap-2">
            <h2>Debounce:</h2>
            <Finput className="w-fit" control={debounce} type="number" />
          </div>
        </div>
      </div>
    );
  },
};
