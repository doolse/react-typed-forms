import { Meta, StoryObj } from "@storybook/react";
import { Fcheckbox, useControl } from "@react-typed-forms/core";

const meta: Meta<typeof Fcheckbox> = {
  title: "React typed forms/Basic/Components/Fcheckbox",
  component: Fcheckbox,
};

export default meta;
type Story = StoryObj<typeof Fcheckbox>;

// language=text
const checkboxCode = `    
// Example code
export function CheckboxExample() {
  const control = useControl(true);
  
  return (
    <div className="container">
      <label className="flex gap-2 text-surface-950 items-center">
        Checkbox <Fcheckbox {...args} control={control} />
      </label>
    </div>
  );
}
`;

export const CheckboxControl: Story = {
  parameters: {
    docs: {
      source: {
        language: "tsx",
        code: checkboxCode,
      },
    },
  },
  render: (args) => {
    const control = useControl(true);
    return (
      <div className="container">
        <label className="flex gap-2 text-surface-950 items-center">
          Checkbox <Fcheckbox {...args} control={control} />
        </label>
      </div>
    );
  },
};

// language=text
const radioCode = `    
// Example code
export function RadioButtonExample() {
  const control = useControl(false);

  return (
    <div className="container">
      <label className="flex gap-2 text-surface-950 items-center">
        Radio Button
        <Fcheckbox {...args} control={control} type="radio" />
      </label>
    </div>
  );
}
`;
export const RadioButtonControl: Story = {
  parameters: {
    docs: {
      source: {
        language: "tsx",
        code: radioCode,
      },
    },
  },
  render: (args) => {
    const control = useControl(false);

    return (
      <div className="container">
        <label className="flex gap-2 text-surface-950 items-center">
          Radio Button
          <Fcheckbox {...args} control={control} type="radio" />
        </label>
      </div>
    );
  },
};
