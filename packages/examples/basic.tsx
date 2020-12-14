import { ctrl, useFormState } from "@react-typed-form/core";
import { Finput } from "@react-typed-form/core";
import { formGroup } from "@react-typed-form/core";
import React, { useState, useRef } from "react";

type SimpleForm = {
  username: string;
  password: string;
};

const FormDef = formGroup<SimpleForm>()({
  password: ctrl((v) =>
    v.length < 6 ? "Password must be 6 characters" : undefined
  ),
  username: ctrl((v) => (!v ? "Required field" : undefined)),
});

let renders = 0;

export function BasicFormExample() {
  renders++;
  const formState = useFormState(FormDef, { username: "", password: "" });
  const { fields } = formState;
  const [formData, setFormData] = useState<SimpleForm>();
  const formRef = useRef<HTMLFormElement>(null);
  return (
    <div className="container">
      <h2>Basic Form Example - {renders} render(s)</h2>
      <p>
        Hitting the toObject() button will also trigger the html5 validity
        errors to show.
      </p>
      <form ref={formRef}>
        <div className="form-group">
          <label>Username: *</label>
          <Finput
            type="text"
            className="form-control"
            state={fields.username}
          />
        </div>
        <div className="form-group">
          <label>Password:</label>
          <Finput
            type="password"
            className="form-control"
            state={fields.password}
          />
        </div>
        <div>
          <button
            className="btn btn-secondary"
            onClick={(e) => {
              e.preventDefault();
              formState.setDisabled(!formState.disabled);
            }}
          >
            Toggle disabled
          </button>{" "}
          <button
            className="btn btn-primary"
            onClick={(e) => {
              setFormData(formState.toObject());
              formRef.current?.reportValidity();
              e.preventDefault();
            }}
          >
            toObject()
          </button>
        </div>
        {formData && (
          <pre className="my-2">{JSON.stringify(formData, undefined, 2)}</pre>
        )}
      </form>
    </div>
  );
}
