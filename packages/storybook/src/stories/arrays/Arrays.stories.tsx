import { ArraysOfStrings } from "./ArraysOfStrings";
import { ArraysOfStructures } from "./ArraysOfStructures";
import { SelectableArrays } from "./SelectableArrays";
import { Meta } from "@storybook/react";

const meta: Meta<{}> = {
  title: "React typed forms/Arrays",
  component: undefined,
  parameters: {
    docs: {
      description: {
        component: `A <code>Control</code> containing an array can split each element out as it's own <code>Control</code> by using the <code>RenderElements</code> component.`,
      },
    },
  },
};

export default meta;

export { ArraysOfStrings, ArraysOfStructures, SelectableArrays };
