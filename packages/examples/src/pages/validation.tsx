import {
  addElement,
  arrayControl,
  buildGroup,
  control,
  FormArray,
  groupControl,
  useAsyncValidator,
  useControlValue,
} from "@react-typed-forms/core";
import React, { useState } from "react";
import { FormInput } from "../bootstrap";
import { useRouter } from "next/router";

type ValidationForm = {
  email: string;
  async: string;
  array: { notBlank: string }[];
};

const emailRegExp =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;

const FormDef = buildGroup<ValidationForm>()({
  email: control("", (v) =>
    !emailRegExp.test(v) ? "Invalid email address" : ""
  ),
  async: control("", null),
  array: arrayControl(
    groupControl({ notBlank: control("", (v) => (!v ? "Blank" : undefined)) })
  ),
});

export default function ValidationExample() {
  const renders = useControlValue<number>((p) => (p ?? 0) + 1);

  const { basePath } = useRouter();
  const [formData, setFormData] = useState<ValidationForm>();
  const [formState] = useState(FormDef);
  const fields = formState.fields;
  const valid = useControlValue(() => formState.valid);

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
      <FormArray state={fields.array}>
        {(elems) =>
          elems.map((s) => (
            <FormInput
              key={s.uniqueId}
              state={s.fields.notBlank}
              label="Not blank"
            />
          ))
        }
      </FormArray>
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
          className="btn btn-secndary"
          onClick={() => {
            addElement(fields.array, { notBlank: "" });
            formState.touched = true;
          }}
        >
          Add array
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
