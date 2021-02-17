import {
  control,
  useFormState,
  formArray,
  buildGroup,
  ControlValue,
  FormControl,
  GroupControl,
  formGroup,
  useFormListener,
  useFormListenerComponent,
  ArrayControl,
} from "@react-typed-forms/core";
import { Finput } from "@react-typed-forms/core";
import { FormArray } from "@react-typed-forms/core";
import React, { useState } from "react";

type RowForm = {
  id: string;
  name: string;
};

type MainForm = {
  strings: string[];
  structured: RowForm[];
};

const FormDef = buildGroup<MainForm>()({
  strings: formArray(control()),
  structured: formArray(
    formGroup({
      id: control(),
      name: control(),
    })
  ),
});

let renders = 0;

export default function ArraysExample() {
  renders++;
  const formState = useFormState(FormDef, {
    strings: [""],
    structured: [{ id: "", name: "" }],
  });
  const { fields } = formState;
  const [formData, setFormData] = useState<MainForm>();
  const Dirty = useFormListenerComponent(fields.structured, (c) => c.dirty);

  function moveUp(fa: ArrayControl<any>, index: number) {
    if (index > 0 && index < fa.elems.length)
      fa.updateFormElements((fields) =>
        fields.map((f, idx) =>
          idx === index
            ? fields[idx - 1]
            : idx === index - 1
            ? fields[index]
            : f
        )
      );
  }
  function moveDown(fa: ArrayControl<any>, index: number) {
    if (index >= 0 && index < fa.elems.length - 1)
      fa.updateFormElements((fields) =>
        fields.map((f, idx) =>
          idx === index
            ? fields[idx + 1]
            : idx === index + 1
            ? fields[idx - 1]
            : f
        )
      );
  }
  return (
    <div className="container">
      <h2>Arrays Example - {renders} render(s)</h2>
      <div className="my-3">
        <h5>Strings</h5>
        <FormArray state={fields.strings}>
          {(elems) =>
            elems.map((c, idx) => (
              <div
                key={c.uniqueId}
                id={`string-${idx + 1}`}
                className="form-inline"
              >
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
            id="addString"
            className="btn"
            onClick={() => fields.strings.addFormElement("")}
          >
            Add
          </button>{" "}
          <button
            id="addStartString"
            className="btn"
            onClick={() => fields.strings.addFormElement("", 0)}
          >
            Add to start
          </button>{" "}
        </div>
      </div>
      <div className="my-3">
        <h5>Structured elements</h5>
        <FormArray state={fields.structured}>
          {(elems) =>
            elems.map(({ fields: c, uniqueId }, idx) => (
              <div id={`obj-${idx + 1}`} key={uniqueId} className="form-inline">
                <div className="form-group mb-2">
                  <label className="mx-2">Id:</label>
                  <Finput
                    type="text"
                    className="idField form-control"
                    state={c.id}
                  />
                </div>
                <div className="form-group mb-2">
                  <label className="mx-2">Name:</label>
                  <Finput
                    type="text"
                    className="nameField form-control"
                    state={c.name}
                  />
                </div>
                <div>
                  <button
                    className="btn mx-2 remove"
                    onClick={() => fields.structured.removeFormElement(idx)}
                  >
                    X
                  </button>
                  <button
                    className="btn mx-2 up"
                    onClick={() => moveUp(fields.structured, idx)}
                  >
                    Up
                  </button>
                  <button
                    className="btn mx-2 down"
                    onClick={() => moveDown(fields.structured, idx)}
                  >
                    Down
                  </button>
                </div>
              </div>
            ))
          }
        </FormArray>
        <div>
          <button
            id="addObj"
            className="btn"
            onClick={() =>
              fields.structured.addFormElement({ id: "", name: "" })
            }
          >
            Add
          </button>{" "}
          <button
            id="setObj"
            className="btn"
            onClick={() =>
              fields.structured.setValue(
                [
                  { name: "Reset", id: "reset" },
                  { id: "id", name: "Name" },
                ],
                true
              )
            }
          >
            Reset
          </button>{" "}
          <Dirty>
            {(dirty) => (
              <span>
                Dirty: <span id="dirtyFlag">{dirty.toString()}</span>
              </span>
            )}
          </Dirty>
        </div>
      </div>
      <div>
        <button
          id="toggleDisabled"
          className="btn btn-secondary"
          onClick={() => formState.setDisabled(!formState.disabled)}
        >
          Toggle disabled
        </button>{" "}
        <button
          id="submit"
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
