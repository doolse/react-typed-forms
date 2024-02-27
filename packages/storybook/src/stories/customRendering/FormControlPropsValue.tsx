import { PlainStory } from "@/index";
import {
  Finput,
  formControlProps,
  useControl,
  useControlEffect,
} from "@react-typed-forms/core";
import { useState } from "@storybook/preview-api";

//language=text
const formControlPropsValueExampleCode = `
//Example code
export function FormControlPropsValueExample() {
  const control = useControl("");
  const { value } = formControlProps(control);

  return (
    <div className="flex flex-col gap-4">
      <label>
        Text: <Finput control={control} />
      </label>

      <div>formControlProps - Value: {value}</div>
    </div>
  );
}
`;

export const FormControlPropsValue: PlainStory = {
  parameters: {
    docs: {
      description: {
        story: "Value",
      },
      source: {
        language: "tsx",
        code: formControlPropsValueExampleCode,
      },
    },
  },
  render: () => {
    const control = useControl("");
    const { value } = formControlProps(control);

    // Internal usage
    const [_, setForceUpdate] = useState(false);
    useControlEffect(
      () => control.value,
      () => setForceUpdate((x) => !x),
    );

    return (
      <div className="flex flex-col gap-4">
        <label>
          Text: <Finput control={control} />
        </label>

        <div>formControlProps - Value: {value}</div>
      </div>
    );
  },
};
