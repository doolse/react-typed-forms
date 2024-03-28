import { StoryObj } from "@storybook/react";

export type PlainStory = StoryObj<{}>;

export interface SimpleForm {
  firstName: string;
  lastName: string;
}
