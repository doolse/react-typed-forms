import { Meta } from "@storybook/react";
import { ControlFlagsDirty } from "./ControlDirty";
import { ControlFlagsValid } from "./ControlValid";
import { ControlFlagsTouched } from "./ControTouched";

const meta: Meta<{}> = {
  title: "React typed forms/Control Flags",
  component: undefined,
};

export default meta;

export { ControlFlagsDirty, ControlFlagsValid, ControlFlagsTouched };
