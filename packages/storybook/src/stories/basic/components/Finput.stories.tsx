import { Meta, StoryObj } from "@storybook/react";
import { Finput, useControl } from "@react-typed-forms/core";

const meta: Meta<typeof Finput> = {
  title: "React typed forms/Basic/Components/FInput",
  component: Finput,
};

export default meta;
type Story = StoryObj<typeof Finput>;

// language=text
const checkboxCode = `    
// Example code
const control = useControl("");

return (
  <div className="container flex flex-col gap-2 text-surface-950">
    <label>Input</label>
    <Finput control={control} />
  </div>
);
`;

export const SingleTextControl: Story = {
  parameters: {
    docs: {
      source: {
        language: "tsx",
        code: checkboxCode,
      },
    },
  },
  render: () => {
    const control = useControl("");

    return (
      <div className="container flex flex-col gap-2 text-surface-950">
        <label>Input</label>
        <Finput control={control} />
      </div>
    );
  },
};
