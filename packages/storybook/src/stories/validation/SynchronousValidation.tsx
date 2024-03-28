import { PlainStory } from "@/index";
import { Finput, useControl } from "@react-typed-forms/core";

//language=text
const synchronousValidationExampleCode = `
// Example code
export function SynchronousValidationExample() {
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
      <Finput id="mustBeHigherThan4" type="text" control={mustBeHigherThan4} />

      <button
        className="bg-primary-800 text-surface-100 rounded-full py-2 px-4"
        id="submit"
      >
        Validate
      </button>
    </form>
  );
}
`;

export const SynchronousValidation: PlainStory = {
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

        <button className="btn-primary" id="submit">
          Validate
        </button>
      </form>
    );
  },
};
