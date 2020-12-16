import {
  control,
  useFormState,
  formArray,
  buildGroup,
} from "@react-typed-forms/core";
import { Finput } from "@react-typed-forms/core";
import { formGroup, FormArray } from "@react-typed-forms/core";
import React, { useState } from "react";

type MainForm = {
  strings: string[];
  structured: {
    id: string;
    name: string;
  }[];
};

const FormDef = buildGroup<MainForm>()({
  strings: formArray(control()),
  structured: formArray(formGroup({ id: control(), name: control() })),
});

let renders = 0;

export function ArraysExample() {
  renders++;
  const formState = useFormState(FormDef, {
    strings: [""],
    structured: [{ id: "", name: "" }],
  });
  const { fields } = formState;
  const [formData, setFormData] = useState<MainForm>();
  return (
    <div className="container">
      <h2>Arrays Example - {renders} render(s)</h2>
      <div className="my-3">
        <h5>Strings</h5>
        <FormArray state={fields.strings}>
          {(elems) =>
            elems.map((c, idx) => (
              <div key={idx} className="form-inline">
                <div className="form-group mb-2">
                  <label className="mx-2">Value:</label>
                  <Finput type="text" className="form-control" state={c} />
                </div>
                <div>
                  <button
                    className="btn mx-2"
                    onClick={() => fields.strings.removeFormElement(idx)}
                  >
                    X
                  </button>
                </div>
              </div>
            ))
          }
        </FormArray>
        <div>
          <button
            className="btn"
            onClick={() => fields.strings.addFormElement("")}
          >
            Add
          </button>
        </div>
      </div>
      <div className="my-3">
        <h5>Structured elements</h5>
        <FormArray state={fields.structured}>
          {(elems) =>
            elems.map(({ fields: c }, idx) => (
              <div key={idx} className="form-inline">
                <div className="form-group mb-2">
                  <label className="mx-2">Id:</label>
                  <Finput type="text" className="form-control" state={c.id} />
                </div>
                <div className="form-group mb-2">
                  <label className="mx-2">Name:</label>
                  <Finput type="text" className="form-control" state={c.name} />
                </div>
                <div>
                  <button
                    className="btn mx-2"
                    onClick={() => fields.structured.removeFormElement(idx)}
                  >
                    X
                  </button>
                </div>
              </div>
            ))
          }
        </FormArray>
        <div>
          <button
            className="btn"
            onClick={() =>
              fields.structured.addFormElement({ id: "", name: "" })
            }
          >
            Add
          </button>
        </div>
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
