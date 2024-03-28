import { Meta } from "@storybook/react";
import { PlainStory } from "@/index";

const meta: Meta<{}> = {
  title: "Styles/All styles",
  component: undefined,
};

export default meta;

//language=css
const styles = `
    /*All styles*/
    @tailwind base;
    @tailwind components;
    @tailwind utilities;


    @layer components {
      .btn {
        @apply rounded-full py-2 px-4
      }

      .btn-primary {
        @apply btn bg-primary-800 text-surface-100
      }

      h2,
      .h2 {
        @apply font-bold text-black;
      }

      .badge {
        @apply min-w-[1rem] text-white px-4 py-1 rounded-full
      }

      .badge-success {
        @apply badge bg-success-500
      }

      .badge-error {
        @apply badge bg-danger-500
      }

      .btn-group {
        @apply flex flex-row gap-4 flex-wrap
      }

      .is-valid {
        @apply border-2 border-success-500
      }

      .is-invalid {
        @apply border-2 border-danger-500
      }

      .card-container {
        @apply flex p-4 bg-surface-100 rounded-lg shadow
      }

      .card-container-vertical {
        @apply card-container flex-col
      }
    }

    @layer utilities {
      .text-balance {
        text-wrap: balance;
      }
    }
`;

export const AllStyles: PlainStory = {
  parameters: {
    docs: {
      source: {
        language: "css",
        code: styles,
      },
    },
  },
  render: () => <>Click "show code" to see all styles</>,
};
