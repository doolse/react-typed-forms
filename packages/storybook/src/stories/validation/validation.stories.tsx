import { Meta, StoryObj } from "@storybook/react";
import { Finput, useAsyncValidator, useControl } from "@react-typed-forms/core";

const meta: Meta<{}> = {
  title: "React typed forms/Validation",
  component: undefined,
};

export default meta;
type Story = StoryObj<{}>;

//language=text
const synchronousValidationExampleCode = `
// Example code
const mustBeHigherThan4 = useControl<number>(0, {
  validator: (v: number) =>
    v > 4 ? undefined : "Please enter a number greater than 4",
});

return (
  <form
    onSubmit={(e) => {
      e.preventDefault();
    }}
    className="flex flex-row gap-2"
  >
    <Finput
      id="mustBeHigherThan4"
      type="text"
      control={mustBeHigherThan4}
    />

    <button
      className="bg-primary-800 text-surface-100 rounded-full p-2"
      id="submit"
    >
      Validate
    </button>
  </form>
);
`;

export const SynchronousValidation: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Synchronous validation can be added to a control upon initialisation via the <code>configure</code> parameter of <code>useControl()</code>.",
      },
      source: {
        language: "tsx",
        code: synchronousValidationExampleCode,
      },
    },
  },
  render: () => {
    const mustBeHigherThan4 = useControl<number>(0, {
      validator: (v: number) =>
        v > 4 ? undefined : "Please enter a number greater than 4",
    });

    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
        }}
        className="flex flex-row gap-2"
      >
        <Finput
          id="mustBeHigherThan4"
          type="text"
          control={mustBeHigherThan4}
        />

        <button
          className="bg-primary-800 text-surface-100 rounded-full p-2"
          id="submit"
        >
          Validate
        </button>
      </form>
    );
  },
};

export const AsyncValidation: Story = {
  parameters: {
    docs: {
      description: {
        story: `If you need complex validation which requires calling a web service, call <code>useAsyncValidator()</code> with your validation callback which returns a <code>Promise</code> with the error message (or null/undefined for valid). You also pass in a debounce time in milliseconds, so that you don't validate on each keypress.`,
      },
      source: {
        language: "tsx",
        code: "",
      },
    },
  },
  render: () => {
    const testControl = useControl(0);

    setInterval(() => (testControl.value = testControl.value + 1), 1000);
    useAsyncValidator(
      testControl,
      async (c, a) => {
        return c.value > 5 ? null : "Must be greater than 5";
      },
      5000,
      (c) => {},
    );

    return <></>;
  },
};
