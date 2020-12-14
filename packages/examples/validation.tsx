import { ctrl, useFormState, useAsyncValidator } from "@react-typed-form/core";
import { formGroup } from "@react-typed-form/core";
import React, { useState, useRef } from "react";
import { FormInput } from "./bootstrap";

type ValidationForm = {
  email: string;
  async: string;
};

const emailRegExp = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;

const FormDef = formGroup<ValidationForm>()({
  email: ctrl((v) => (!emailRegExp.test(v) ? "Invalid email address" : "")),
  async: ctrl(null),
});

let renders = 0;

export function ValidationExample() {
  renders++;
  const formState = useFormState(FormDef, { email: "", async: "" });
  const { fields } = formState;
  const [formData, setFormData] = useState<ValidationForm>();

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
      <p>
        Hitting the toObject() button will also trigger the html5 validity
        errors to show.
      </p>
      <FormInput label="Email:" type="text" state={fields.email} />
      <FormInput label="Async:" type="text" state={fields.async} showValid />
      <div>
        <button
          className="btn btn-secondary"
          onClick={() => formState.setDisabled(!formState.disabled)}
        >
          Toggle disabled
        </button>{" "}
        <button
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
