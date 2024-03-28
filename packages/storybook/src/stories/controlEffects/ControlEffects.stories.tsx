import { Meta } from "@storybook/react";
import { UseControlEffect } from "./UseControlEffect";
import { UseValueChangeEffect } from "./UseValueChangeEffect";
import { UseComputed } from "./UseComputed";

const meta: Meta<{}> = {
  title: "React typed forms/Control Effects",
  component: undefined,
};

export default meta;

export { UseControlEffect, UseValueChangeEffect, UseComputed };
