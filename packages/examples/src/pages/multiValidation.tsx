import { useControl, useControlEffect } from "@react-typed-forms/core";
import React from "react";
import { FormInput } from "../bootstrap";
import { useValidator } from "@react-typed-forms/core";

export default function MultiValidationExample() {
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
  return (
    <div className="container">
      <h2>Multi Validation Example</h2>
      <FormInput id="email" label="Email:" type="text" state={field} />
      <div>
        <button id="clearErrors" onClick={() => field.clearErrors()}>
          Clear errors
        </button>
      </div>
      <pre className="my-2">
        {JSON.stringify({ errors, error }, undefined, 2)}
      </pre>
    </div>
  );
}
