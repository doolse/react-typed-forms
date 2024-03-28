import { PlainStory } from "@/index";
import React from "react";
import {
  useComputed,
  useControl,
  useControlEffect,
  useValidator,
} from "@react-typed-forms/core";
import { useState } from "@storybook/preview-api";
import { FormInput } from "../../components/FormInput";
import { clsx } from "clsx";

//language=text
const multiValidationCode = `
//Example code
export function MultiValidationExample() {
  const field = useControl("");
  const errors = field.errors;
  const error = field.error;

  useValidator(
    field,
    (v) => (v && v != "Smoth" ? "it aint 'Smoth'" : ""),
    "Smotho",
  );
  useValidator(field, (v) => (v ? "" : "its empty"));
  useValidator(field, (v) => (v.length > 3 ? "It's too long" : ""), "length");

  const fieldErrors = useComputed(() => {
    return field.errors;
  }).value;

  return (
    <div className="container flex flex-col gap-4">
      <h2>Multi Validation Example</h2>
      <section className="flex flex-col gap-4 w-fit">
        <h2>Add three validators:</h2>
        <div
          className={clsx(
            "card-container-vertical gap-2 text-white w-full",
            Object.keys(fieldErrors).includes("Smotho")
              ? "bg-danger-600"
              : "bg-success-600",
          )}
        >
          <span>"key": "Smotho"</span>
          <span>
            {\`"validator": (v) => (v && v != "Smoth" ? "it aint 'Smoth'" : "")\`}
          </span>
        </div>
        <div
          className={clsx(
            "card-container-vertical gap-2 text-white w-full",
            Object.keys(fieldErrors).includes("default")
              ? "bg-danger-600"
              : "bg-success-600",
          )}
        >
          <span>"key": undefined (will be set as "default")</span>
          <span>{\`"validator": (v) => (v ? "" : "its empty")\`}</span>
        </div>
        <div
          className={clsx(
            "card-container-vertical gap-2 text-white w-full",
            Object.keys(fieldErrors).includes("length")
              ? "bg-danger-600"
              : "bg-success-600",
          )}
        >
          <span>"key": "length"</span>
          <span>
            {\`"validator": (v) => (v.length > 3 ? "It's too long" : "")\`}
          </span>
        </div>
      </section>
      <FormInput id="email" label="Email:" type="text" state={field} />
      <div>
        <button
          id="clearErrors"
          className="btn-primary"
          onClick={() => field.clearErrors()}
        >
          Clear errors
        </button>
      </div>
      <pre className="my-2">
        {JSON.stringify({ errors, error }, undefined, 2)}
      </pre>
    </div>
  );
}
`;

export const MultiValidation: PlainStory = {
  parameters: {
    docs: {
      description: {
        story: `Use <code>useValidator</code> to add several validations for a <code>control</code>.`,
      },
      source: {
        language: "tsx",
        code: multiValidationCode,
      },
    },
  },
  render: () => {
    const field = useControl("");
    const errors = field.errors;
    const error = field.error;

    useValidator(
      field,
      (v) => (v && v != "Smoth" ? "it aint 'Smoth'" : ""),
      "Smotho",
    );
    useValidator(field, (v) => (v ? "" : "its empty"));
    useValidator(field, (v) => (v.length > 3 ? "It's too long" : ""), "length");

    const fieldErrors = useComputed(() => {
      return field.errors;
    }).value;

    // Internal usage
    const [_, setForceUpdate] = useState(false);
    useControlEffect(
      () => field.value,
      () => setForceUpdate((x) => !x),
    );

    return (
      <div className="container flex flex-col gap-4">
        <h2>Multi Validation Example</h2>
        <section className="flex flex-col gap-4 w-fit">
          <h2>Add three validators:</h2>
          <div
            className={clsx(
              "card-container-vertical gap-2 text-white w-full",
              Object.keys(fieldErrors).includes("Smotho")
                ? "bg-danger-600"
                : "bg-success-600",
            )}
          >
            <span>"key": "Smotho"</span>
            <span>
              {`"validator": (v) => (v && v != "Smoth" ? "it aint 'Smoth'" : "")`}
            </span>
          </div>
          <div
            className={clsx(
              "card-container-vertical gap-2 text-white w-full",
              Object.keys(fieldErrors).includes("default")
                ? "bg-danger-600"
                : "bg-success-600",
            )}
          >
            <span>"key": undefined (will be set as "default")</span>
            <span>{`"validator": (v) => (v ? "" : "its empty")`}</span>
          </div>
          <div
            className={clsx(
              "card-container-vertical gap-2 text-white w-full",
              Object.keys(fieldErrors).includes("length")
                ? "bg-danger-600"
                : "bg-success-600",
            )}
          >
            <span>"key": "length"</span>
            <span>
              {`"validator": (v) => (v.length > 3 ? "It's too long" : "")`}
            </span>
          </div>
        </section>
        <FormInput
          id="email"
          label="Email:"
          type="text"
          state={field}
          controlTouched={() => setForceUpdate((x) => !x)}
        />
        <div>
          <button
            id="clearErrors"
            className="btn-primary"
            onClick={() => {
              field.clearErrors();
              setForceUpdate((x) => !x);
            }}
          >
            Clear errors
          </button>
        </div>
        <pre className="my-2">
          {JSON.stringify({ errors, error }, undefined, 2)}
        </pre>
      </div>
    );
  },
};
