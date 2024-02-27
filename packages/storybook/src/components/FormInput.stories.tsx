import { Meta } from "@storybook/react";
import { PlainStory } from "@/index";
import {
  notEmpty,
  useControl,
  useControlEffect,
} from "@react-typed-forms/core";
import { FormInput } from "./FormInput";
import { useState } from "@storybook/preview-api";

const meta: Meta<{}> = {
  title: "Common Component/FormInput",
  component: undefined,
};

export default meta;

//language=text
const formInputCode = `
//Example code
function FormInput({
  state,
  label,
  showValid,
  id,
  ...others
}: React.InputHTMLAttributes<HTMLInputElement> & {
  state: Control<string | number>;
  label: ReactNode;
  showValid?: boolean;
}) {
  const { errorText, ...formProps } = formControlProps(state);

  return (
    <div className="flex gap-2 items-center" id={id}>
      {label && <label>{label}</label>}
      <input
        {...formProps}
        className={\`form-control $\{
          state.touched
            ? showValid
              ? state.valid
                ? "is-valid"
                : "is-invalid"
              : ""
            : ""
        }\`}
        {...others}
      />
      {errorText ? <span className="badge-error">{errorText}</span> : <></>}
    </div>
  );
}
`;

export const FormInputComponent: PlainStory = {
  parameters: {
    docs: {
      description: {
        story: `Common component in the storybook`,
      },
      source: {
        language: "tsx",
        code: formInputCode,
      },
    },
  },
  render: () => {
    const control = useControl("", { validator: notEmpty("Blank") });

    const [_, setForceUpdate] = useState(false);

    useControlEffect(
      () => control.value,
      () => setForceUpdate((x) => !x),
    );

    return (
      <FormInput
        state={control}
        label="Form Input:"
        id="Form Input"
        controlTouched={() => setForceUpdate((x) => !x)}
        showValid
      />
    );
  },
};
