import {
  Finput,
  FormArray,
  FormControl,
  notEmpty,
  useControl,
  useControlStateComponent,
  validated,
  withElems,
  withFields,
} from "@react-typed-forms/core";
import React, { useState } from "react";

type RowForm = {
  id: string;
  name: string;
};

type MainForm = {
  strings: string[];
  structured: RowForm[];
};

const defaultRow: RowForm = { id: "", name: "" };

const FormDef = withFields<MainForm>({
  structured: withElems(
    withFields<RowForm>({
      id: validated(notEmpty("Not blank")),
    })
  ),
});

let renders = 0;

export default function ArraysExample() {
  renders++;
  const formState = useControl(
    {
      strings: [""],
      structured: [{ id: "", name: "" }],
    },
    FormDef
  );
  console.log(formState);
  const { fields } = formState;
  const [formData, setFormData] = useState<MainForm>();
  const Dirty = useControlStateComponent(fields.structured, (c) => {
    // console.log(c, c.dirty);
    return c.dirty;
  });
  const Valid = useControlStateComponent(fields.structured, (c) => c.valid);

  function moveUp(fa: FormControl<any[]>, index: number) {
    if (index > 0 && index < fa.elems.length)
      fa.update((fields) =>
        fields.map((f, idx) =>
          idx === index
            ? fields[idx - 1]
            : idx === index - 1
            ? fields[index]
            : f
        )
      );
  }
  function moveDown(fa: FormControl<any[]>, index: number) {
    if (index >= 0 && index < fa.elems.length - 1)
      fa.update((fields) =>
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
                    onClick={() => fields.strings.remove(idx)}
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
            onClick={() => fields.strings.add("")}
          >
            Add
          </button>{" "}
          <button
            id="addStartString"
            className="btn"
            onClick={() => fields.strings.add("", 0)}
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
                    onClick={() => fields.structured.remove(idx)}
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
            onClick={() => fields.structured.add(defaultRow)}
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
          <button
            id="setDifferent"
            className="btn"
            onClick={() =>
              fields.structured.setValue([
                { name: "Reset", id: "reset" },
                { id: "id", name: "Name" },
                { id: "Another", name: "Righto" },
              ])
            }
          >
            Set different
          </button>{" "}
          <Dirty>
            {(dirty) => (
              <span>
                Dirty: <span id="dirtyFlag">{dirty.toString()}</span>
              </span>
            )}
          </Dirty>{" "}
          <Valid>
            {(valid) => (
              <span>
                Valid: <span id="validFlag">{valid.toString()}</span>
              </span>
            )}
          </Valid>
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
        </button>{" "}
        <button
          id="clean"
          className="btn btn-primary"
          onClick={() => formState.markAsClean()}
        >
          Mark Clean
        </button>
      </div>
      {formData && (
        <pre className="my-2">{JSON.stringify(formData, undefined, 2)}</pre>
      )}
    </div>
  );
}
