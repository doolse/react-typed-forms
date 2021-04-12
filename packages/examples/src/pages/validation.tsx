import {
  useAsyncValidator,
  buildGroup,
  useNodeForDefinition,
  node,
} from "@react-typed-forms/core";
import React, { useState, useRef } from "react";
import { FormInput } from "../bootstrap";

type ValidationForm = {
  email: string;
  async: string;
};

const emailRegExp = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;

const FormDef = buildGroup<ValidationForm>()({
  email: node("", (v) => (!emailRegExp.test(v) ? "Invalid email address" : "")),
  async: node("", null),
});

let renders = 0;

export default function ValidationExample() {
  renders++;

  const [formData, setFormData] = useState<ValidationForm>();
  const formState = useNodeForDefinition(FormDef);
  const { fields } = formState;

  useAsyncValidator(
    fields.async,
    (n, signal) =>
      fetch("/api/validate", {
        method: "POST",
        signal,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ value: n.value }),
      }).then((resp) => {
        return resp.json().then((r) => r.error);
      }),
    500
  );
  return (
    <div className="container">
      <h2>Validation Example - {renders} render(s)</h2>
      <FormInput id="email" label="Email:" type="text" state={fields.email} />
      <FormInput
        id="async"
        label="Async:"
        type="text"
        state={fields.async}
        showValid
      />
      <div>
        <button
          className="btn btn-secondary"
          onClick={() => formState.setDisabled(!formState.disabled)}
        >
          Toggle disabled
        </button>{" "}
        <button
          id="submit"
          className="btn btn-primary"
          onClick={(e) => setFormData(formState.toObject())}
        >
          toObject()
        </button>
      </div>
      {formData && (
        <pre className="my-2">{JSON.stringify(formData, undefined, 2)}</pre>
      )}
    </div>
  );
}
