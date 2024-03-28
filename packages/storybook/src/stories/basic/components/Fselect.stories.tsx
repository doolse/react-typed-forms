import { Meta, StoryObj } from "@storybook/react";
import { Fselect, useControl, useControlEffect } from "@react-typed-forms/core";
import React from "react";

const meta: Meta<typeof Fselect> = {
  title: "React typed forms/Basic/Components/Fselect",
  component: Fselect,
};

export default meta;
type Story = StoryObj<typeof Fselect>;

// language=text
const selectCode = `    
// Example code
export function SelectControlExample() {
  const selectControl = useControl("one");

  return (
    <div className="container flex flex-row gap-2 text-surface-950 items-center">
      <label>A number:</label>
      <Fselect control={selectControl}>
        <option value="">None</option>
        <option value="one">1</option>
        <option value="two">2</option>
      </Fselect>
    </div>
  );
}
`;

export const SelectControl: Story = {
  parameters: {
    docs: {
      source: {
        language: "tsx",
        code: selectCode,
      },
    },
  },
  render: () => {
    const selectControl = useControl("one");

    return (
      <div className="container flex flex-row gap-2 text-surface-950 items-center">
        <label>A number:</label>
        <Fselect control={selectControl}>
          <option value="">None</option>
          <option value="one">1</option>
          <option value="two">2</option>
        </Fselect>
      </div>
    );
  },
};
