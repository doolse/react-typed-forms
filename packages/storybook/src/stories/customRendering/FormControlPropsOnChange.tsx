import { PlainStory } from "@/index";
import {
  Fcheckbox,
  Finput,
  formControlProps,
  useControl,
  useControlEffect,
} from "@react-typed-forms/core";
import { useState } from "@storybook/preview-api";

//language=text
const formControlPropsOnChangeExampleCode = `
//Example code
export function FormControlPropsOnChangeExample() {
  const control = useControl("");
  const { onChange } = formControlProps(control);

  const canUpdate = useControl(true);

  return (
    <div className="flex flex-col gap-4">
      <label className="flex items-center gap-2">
        <Fcheckbox control={canUpdate} />
        Can update value
      </label>
      <label>
        Text:{" "}
        <Finput
          control={control}
          onChange={(e) => {
            if (canUpdate.value) {
              onChange(e);
            }
          }}
        />
      </label>

      <div>formControlProps - Value: {control.value}</div>
    </div>
  );
}
`;

export const FormControlPropsOnChange: PlainStory = {
  parameters: {
    docs: {
      description: {
        story: "You can control the `Control` update event through `onChange`",
      },
      source: {
        language: "tsx",
        code: formControlPropsOnChangeExampleCode,
      },
    },
  },
  render: () => {
    const control = useControl("");
    const { onChange } = formControlProps(control);

    const canUpdate = useControl(true);

    // Internal usage
    const [_, setForceUpdate] = useState(false);
    useControlEffect(
      () => control.value,
      () => setForceUpdate((x) => !x),
    );

    return (
      <div className="flex flex-col gap-4">
        <label className="flex items-center gap-2">
          <Fcheckbox control={canUpdate} />
          Can update value
        </label>
        <label>
          Text:{" "}
          <Finput
            control={control}
            onChange={(e) => {
              if (canUpdate.value) {
                onChange(e);
              }
            }}
          />
        </label>

        <div>formControlProps - Value: {control.value}</div>
      </div>
    );
  },
};
