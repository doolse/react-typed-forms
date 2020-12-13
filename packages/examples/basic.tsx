import { ctrl, useFormState } from "@react-typed-form/core";
import { Finput } from "@react-typed-form/core";
import { formGroup } from "@react-typed-form/core";
import React, { useState } from "react";

type SimpleForm = {
  username: string;
  password: string;
};

const FormDef = formGroup<SimpleForm>()({
  password: ctrl(),
  username: ctrl((v) => (!v ? "Please fill this in" : undefined)),
});

let renders = 0;

export function BasicFormExample() {
  renders++;
  const formState = useFormState(FormDef, { username: "", password: "" });
  const { fields } = formState;
  const [formData, setFormData] = useState<SimpleForm>();
  return (
    <div className="container">
      <h2>Basic Form Example - {renders} render(s)</h2>
      <div className="form-group">
        <label>Username:</label>
        <Finput type="text" className="form-control" state={fields.username} />
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
          onClick={() => formState.setDisabled(!formState.disabled)}
        >
          Toggle disabled
        </button>{" "}
        <button
          className="btn btn-primary"
          onClick={() => setFormData(formState.toObject())}
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
