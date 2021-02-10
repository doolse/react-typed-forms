import {
  control,
  useFormState,
  buildGroup,
  Fselect,
} from "@react-typed-forms/core";
import { Finput } from "@react-typed-forms/core";
import React, { useState, useRef } from "react";

type SimpleForm = {
  username: string;
  password: string;
  number: string;
};

const FormDef = buildGroup<SimpleForm>()({
  password: control((v) =>
    v.length < 6 ? "Password must be 6 characters" : undefined
  ),
  username: control((v) => (!v ? "Required field" : undefined)),
  number: control(),
});

let renders = 0;

export default function BasicFormExample() {
  renders++;
  const formState = useFormState(FormDef, {
    username: "",
    password: "",
    number: "",
  });
  const { fields } = formState;
  const [formData, setFormData] = useState<SimpleForm>();
  const formRef = useRef<HTMLFormElement>(null);
  return (
    <div className="container">
      <h2>
        Basic Form Example - <span id="renderCount">{renders}</span> render(s)
      </h2>
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
            id="username"
            state={fields.username}
          />
        </div>
        <div className="form-group">
          <label>Password:</label>
          <Finput
            type="password"
            id="password"
            className="form-control"
            state={fields.password}
          />
        </div>
        <div className="form-group">
          <label>A number:</label>
          <Fselect className="form-control" id="number" state={fields.number}>
            <option value="">None</option>
            <option value="one">1</option>
            <option value="two">2</option>
          </Fselect>
        </div>
        <div>
          <button
            id="toggleDisabled"
            className="btn btn-secondary"
            onClick={(e) => {
              e.preventDefault();
              formState.setDisabled(!formState.disabled);
            }}
          >
            Toggle disabled
          </button>{" "}
          <button
            id="submit"
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
