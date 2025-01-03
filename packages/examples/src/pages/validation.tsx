import {
  addElement,
  notEmpty,
  RenderElements,
  useAsyncValidator,
  useControl,
} from "@react-typed-forms/core";
import React, { useState } from "react";
import { FormInput } from "../bootstrap";
import { useRouter } from "next/router";
import { useRenderCount } from "../index";
import { useValidator } from "@react-typed-forms/core";

type ValidationForm = {
  email: string;
  async: string;
  array: { notBlank: string }[];
  hook: string;
};

const emailRegExp =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;

export default function ValidationExample() {
  const renders = useRenderCount();
  const { basePath } = useRouter();
  const [formData, setFormData] = useState<ValidationForm>();
  const formState = useControl<ValidationForm>(
    { email: "", async: "", array: [], hook: "" },
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

  useAsyncValidator(
    fields.async,
    (n, signal) =>
      new Promise<string>((resolve) => {
        setTimeout(() => {
          console.log("Asyncing");
          resolve(
            n.current.value != "OK"
              ? `Error: "${n.current.value}" is not "OK"`
              : "",
          );
        }, 1000);
      }),
    500,
  );
  useValidator(fields.hook, notEmpty("Hook not empty"));
  return (
    <div className="container">
      <h2>Validation Example - {renders} render(s)</h2>
      <FormInput id="email" label="Email:" type="text" state={fields.email} />
      <FormInput id="hook" label="Hook:" type="text" state={fields.hook} />
      <FormInput
        id="async"
        label="Async:"
        type="text"
        state={fields.async}
        showValid
      />
      <RenderElements control={fields.array}>
        {(s) => <FormInput state={s.fields.notBlank} label="Not blank" />}
      </RenderElements>
      <div>
        <button
          className="btn btn-secondary"
          onClick={() => (formState.disabled = !formState.current.disabled)}
        >
          Toggle disabled
        </button>{" "}
        <button
          id="submit"
          className="btn btn-primary"
          onClick={(e) => setFormData(formState.current.value)}
        >
          toObject()
        </button>{" "}
        <button
          id="add"
          className="btn btn-secondary"
          onClick={() => {
            addElement(fields.array, { notBlank: "" });
            formState.touched = true;
          }}
        >
          Add array
        </button>{" "}
        <button
          id="setErrors"
          className="btn btn-secondary"
          onClick={() => fields.email.setErrors({ default: "" })}
        >
          setErrors
        </button>
        <button
          id="clearErrors"
          className="btn btn-secondary"
          onClick={() => formState.clearErrors()}
        >
          clearErrors()
        </button>
        <button
          id="validate"
          className="btn btn-secondary"
          onClick={() => {
            formState.touched = true;
            formState.validate();
          }}
        >
          validate()
        </button>
      </div>
      <span>
        Valid: <span id="validFlag">{valid.toString()}</span>
      </span>
      {formData && (
        <pre className="my-2">{JSON.stringify(formData, undefined, 2)}</pre>
      )}
    </div>
  );
}
