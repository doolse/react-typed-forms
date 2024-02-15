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
  },
  decorators: [],
};
export default preview;
