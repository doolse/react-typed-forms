import { Meta } from "@storybook/react";
import { SynchronousValidation } from "./SynchronousValidation";
import { AsyncValidation } from "./AsyncValidation";
import { MultiValidation } from "./MultiValidation";

const meta: Meta<{}> = {
  title: "React typed forms/Validation",
  component: undefined,
};

export default meta;

export { SynchronousValidation, AsyncValidation, MultiValidation };
