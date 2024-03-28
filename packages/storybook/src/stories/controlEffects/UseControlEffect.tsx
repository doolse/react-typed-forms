import { PlainStory } from "@/index";
import {
  Fcheckbox,
  Finput,
  useControl,
  useControlEffect,
} from "@react-typed-forms/core";
import React from "react";

const useControlEffectDescription = `
**Run effects based when a computed value changes.**

> \`compute\` - A function which calculates a value, if the value ever changes (equality is a shallow equals), the \`onChange\` effect is called.

>\`onChange\` - The effect to run when the calculated value changes.

>\`initial\` \`Optional\` - This will be called first time if a function is passed in, or if \`true\` the \`onChange\` handler will run first time.
`;

//language=text
const useControlEffectExampleCode = `
// Example code
export function UseControlEffectExample() {
  // Compute single control
  const singleControl = useControl("");

  useControlEffect(
    () => singleControl.value,
    (v) => console.log("Single Control:", v),
    () => console.log("Initial function"),
  );
  useControlEffect(
    () => singleControl.dirty,
    (v) => console.log("Dirty flag:", v),
    true,
  );

  // Compute multiple controls
  const multipleControl = useControl("");
  const showAlert = useControl(false);

  useControlEffect(
    () => [multipleControl.value, showAlert.value] as const,
    ([multipleControl, showAlert]) => {
      if (multipleControl && showAlert) {
        setTimeout(() => {
          alert(multipleControl);
        }, 1000);
      }
    },
  );

  return (
    <div className="flex flex-col gap-4">
      <h2>
        You can observe any value changes, such as: value (most common), dirty
        flag, valid flag, etc.
      </h2>

      <div className="flex flex-col gap-2">
        <h2>Compute single control:</h2>
        <span>Open console to see value</span>
        <Finput className="w-fit" control={singleControl} />
      </div>

      <div className="flex flex-col gap-2">
        <h2>Compute multiple controls:</h2>
        <label className="w-fit">
          Show alert <Fcheckbox control={showAlert} />
        </label>
        <Finput className="w-fit" control={multipleControl} />
      </div>
    </div>
  );
}
`;

export const UseControlEffect: PlainStory = {
  parameters: {
    docs: {
      description: {
        story: useControlEffectDescription,
      },
      source: {
        language: "tsx",
        code: useControlEffectExampleCode,
      },
    },
  },
  render: () => {
    // Compute single control
    const singleControl = useControl("");

    useControlEffect(
      () => singleControl.value,
      (v) => console.log("Single Control:", v),
      () => console.log("Initial function"),
    );
    useControlEffect(
      () => singleControl.dirty,
      (v) => console.log("Dirty flag:", v),
      true,
    );

    // Compute multiple controls
    const multipleControl = useControl("");
    const showAlert = useControl(false);

    useControlEffect(
      () => [multipleControl.value, showAlert.value] as const,
      ([multipleControl, showAlert]) => {
        if (multipleControl && showAlert) {
          setTimeout(() => {
            alert(multipleControl);
          }, 1000);
        }
      },
    );

    return (
      <div className="flex flex-col gap-4">
        <h2>
          You can observe any value changes, such as: value (most common), dirty
          flag, valid flag, etc.
        </h2>

        <div className="flex flex-col gap-2">
          <h2>Compute single control:</h2>
          <span>Open console to see value</span>
          <Finput className="w-fit" control={singleControl} />
        </div>

        <div className="flex flex-col gap-2">
          <h2>Compute multiple controls:</h2>
          <label className="w-fit">
            Show alert <Fcheckbox control={showAlert} />
          </label>
          <Finput className="w-fit" control={multipleControl} />
        </div>
      </div>
    );
  },
};
