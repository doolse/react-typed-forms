import { PlainStory } from "@/index";
import {
  addElement,
  notEmpty,
  RenderElements,
  useAsyncValidator,
  useControl,
  useControlEffect,
  useControlValue,
} from "@react-typed-forms/core";
import { useState } from "@storybook/preview-api";
import { useRouter } from "next/router";
import React from "react";
import { FormInput } from "../../components/FormInput";

//language=text
const asyncExampleCode = `
// Example code
type ValidationForm = {
  email: string;
  async: string;
  array: { notBlank: string }[];
};

const emailRegExp =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_\`{|}~-]+@[a-zA-Z0-9-]+(?:\\.[a-zA-Z0-9-]+)*$/;

export function AsyncValidationExample() {
  const renders = useControlValue<number>((p) => (p ?? 0) + 1);
  const { basePath } = useRouter();

  const [formData, setFormData] = useState<ValidationForm>({
    email: "",
    async: "",
    array: [],
  });
  const formState = useControl<ValidationForm>(
    { email: "", async: "", array: [] },
    {
      fields: {
        email: {
          validator: (v) =>
            !emailRegExp.test(v) ? "Invalid email address" : "",
        },
        async: { validator: null },
        array: {
          elems: { fields: { notBlank: { validator: notEmpty("Blank") } } },
        },
      },
    },
  );
  const fields = formState.fields;
  const valid = formState.valid;

  useControlEffect(
    () => formState.value,
    (v) => {
      setFormData(v);
    },
  );

  useAsyncValidator(
    fields.async,
    (n, signal) =>
      fetch(basePath + "/api/validate", {
        method: "POST",
        signal,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ value: n.current.value }),
      })
        .then(async (resp) => {
          const r = await resp.json();
          return r.error;
        })
        .catch((error) => {
          return error.toString();
        }),
    500,
  );

  return (
    <div className="flex flex-col gap-4">
      <h2>Validation Example - {renders} render(s)</h2>
      <span>
        {valid ? (
          <span className="badge-success">Form Valid</span>
        ) : (
          <span className="badge-error">Form Not Valid</span>
        )}
      </span>
      <FormInput
        id="email"
        label="Email:"
        type="text"
        state={fields.email}
        showValid
      />
      <FormInput id="async" label="Async:" type="text" state={fields.async} />
      <RenderElements control={fields.array}>
        {(s) => <FormInput state={s.fields.notBlank} label="Not blank:" />}
      </RenderElements>
      <div className="btn-group">
        <button
          className="btn-primary"
          onClick={() => {
            formState.disabled = !formState.current.disabled;
          }}
        >
          Toggle disabled
        </button>
        <button
          id="add"
          className="btn-primary"
          onClick={() => {
            addElement(fields.array, { notBlank: "" });
            formState.touched = true;
          }}
        >
          Add array
        </button>
      </div>
      {formData && (
        <pre className="my-2">{JSON.stringify(formData, undefined, 2)}</pre>
      )}
    </div>
  );
}
`;

type ValidationForm = {
  email: string;
  async: string;
  array: { notBlank: string }[];
};

const emailRegExp =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;

export const AsyncValidation: PlainStory = {
  parameters: {
    docs: {
      description: {
        story: `If you need complex validation which requires calling a web service, call <code>useAsyncValidator()</code> with your validation callback which returns a <code>Promise</code> with the error message (or null/undefined for valid). You also pass in a debounce time in milliseconds, so that you don't validate on each keypress.`,
      },
      source: {
        language: "tsx",
        code: asyncExampleCode,
      },
    },
  },
  render: () => {
    const [_, setForceUpdate] = useState(false);

    const renders = useControlValue<number>((p) => (p ?? 0) + 1);

    const { basePath } = useRouter();
    const [formData, setFormData] = useState<ValidationForm>({
      email: "",
      async: "",
      array: [],
    });
    const formState = useControl<ValidationForm>(
      { email: "", async: "", array: [] },
      {
        fields: {
          email: {
            validator: (v) =>
              !emailRegExp.test(v) ? "Invalid email address" : "",
          },
          async: { validator: null },
          array: {
            elems: { fields: { notBlank: { validator: notEmpty("Blank") } } },
          },
        },
      },
    );
    const fields = formState.fields;
    const valid = formState.valid;

    useControlEffect(
      () => formState.value,
      (v) => {
        setFormData(v);
      },
    );

    useAsyncValidator(
      fields.async,
      (n, signal) =>
        fetch(basePath + "/api/validate", {
          method: "POST",
          signal,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ value: n.current.value }),
        })
          .then(async (resp) => {
            const r = await resp.json();
            return r.error;
          })
          .catch((error) => {
            return error.toString();
          }),
      500,
    );

    // Internal usage
    useControlEffect(
      () => [fields.email.error, fields.async.error],
      () => setForceUpdate((x) => !x),
    );

    return (
      <div className="flex flex-col gap-4">
        <h2>Validation Example - {renders} render(s)</h2>
        <span>
          {valid ? (
            <span className="badge-success">Form Valid</span>
          ) : (
            <span className="badge-error">Form Not Valid</span>
          )}
        </span>
        <FormInput
          id="email"
          label="Email:"
          type="text"
          state={fields.email}
          showValid
          controlTouched={(v) => {
            setForceUpdate((x) => !x);
          }}
        />
        <FormInput
          id="async"
          label="Async:"
          type="text"
          state={fields.async}
          controlTouched={(v) => {
            setForceUpdate((x) => !x);
          }}
        />
        <RenderElements control={fields.array}>
          {(s) => (
            <FormInput
              state={s.fields.notBlank}
              label="Not blank:"
              controlTouched={(v) => {
                setForceUpdate((x) => !x);
              }}
            />
          )}
        </RenderElements>
        <div className="btn-group">
          <button
            className="btn-primary"
            onClick={() => {
              formState.disabled = !formState.current.disabled;
              setForceUpdate((x) => !x);
            }}
          >
            Toggle disabled
          </button>
          <button
            id="add"
            className="btn-primary"
            onClick={() => {
              addElement(fields.array, { notBlank: "" });
              formState.touched = true;
            }}
          >
            Add array
          </button>
        </div>
        {formData && (
          <pre className="my-2">{JSON.stringify(formData, undefined, 2)}</pre>
        )}
      </div>
    );
  },
};
