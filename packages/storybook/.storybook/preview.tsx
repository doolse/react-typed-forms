import type { Preview } from "@storybook/react";
import "../src/app/globals.css";
import { Title, Subtitle, Description, Stories } from "@storybook/blocks";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    docs: {
      page: () => (
        <>
          <Title />
          <Subtitle />
          <Description />
          {/*<Canvas />*/}
          <Stories />
          {/*<Source />*/}
        </>
      ),
    },
    options: {
      // https://storybook.js.org/docs/8.0/writing-stories/naming-components-and-hierarchy#sorting-stories
      storySort: {
        order: [
          "React typed forms",
          [
            "Basic",
            ["Components", "*"],
            "Arrays",
            "Control Flags",
            "Control Effects",
            "Validation",
            "Optional Nullable Values",
            "formControlProps",
            "Advanced",
          ],
          "Common Component",
          "Styles",
        ],
      },
    },
  },
  decorators: [],
};
export default preview;
