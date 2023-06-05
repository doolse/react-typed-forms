import {
  addElement,
  Control,
  ControlSetup,
  Finput,
  FormArray,
  notEmpty,
  removeElement,
  RenderControl,
  updateElements,
  useControl,
  useControlValue,
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

const FormDef: ControlSetup<MainForm> = {
  fields: {
    structured: {
      elems: {
        fields: { id: { validator: notEmpty("Not blank") } },
      },
    },
  },
};

export default function ArraysExample() {
  const renders = useControlValue<number>((p) => (p ?? 0) + 1);
  const formState = useControl(
    {
      strings: [""],
      structured: [{ id: "", name: "" }],
    },
    FormDef
  );
  const fields = formState.fields;
  const [formData, setFormData] = useState<MainForm>();

  function moveUp(fa: Control<any[]>, index: number) {
    if (index > 0 && index < fa.elements.length)
      updateElements(fa, (fields) =>
        fields.map((f, idx) =>
          idx === index
            ? fields[idx - 1]
            : idx === index - 1
            ? fields[index]
            : f
        )
      );
  }
  function moveDown(fa: Control<any[]>, index: number) {
    if (index >= 0 && index < fa.elements.length - 1)
      updateElements(fa, (fields) =>
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
        <FormArray control={fields.strings}>
          {(elems) =>
            elems.map((c, idx) => (
              <div
                key={c.uniqueId}
                id={`string-${idx + 1}`}
                className="form-inline"
              >
                <div className="form-group mb-2">
                  <label className="mx-2">Value:</label>
                  <Finput type="text" className="form-control" control={c} />
                </div>
                <div>
                  <button
                    className="btn mx-2"
                    id={`rem-${idx + 1}`}
                    onClick={() => removeElement(fields.strings, idx)}
                  >
                    X
                  </button>
                  <button
                    className="btn mx-2"
                    id={`before-${idx + 1}`}
                    onClick={() => addElement(fields.strings, "Before", c)}
                  >
                    Insert before
                  </button>
                  <button
                    className="btn mx-2"
                    id={`after-${idx + 1}`}
                    onClick={() => addElement(fields.strings, "After", c, true)}
                  >
                    Insert After
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
            onClick={() => addElement(fields.strings, "")}
          >
            Add
          </button>{" "}
          <button
            id="addStartString"
            className="btn"
            onClick={() => addElement(fields.strings, "", 0)}
          >
            Add to start
          </button>{" "}
        </div>
      </div>
      <div className="my-3">
        <h5>Structured elements</h5>
        <FormArray control={fields.structured}>
          {(elems) =>
            elems.map((c, idx) => (
              <div
                id={`obj-${idx + 1}`}
                key={c.uniqueId}
                className="form-inline"
              >
                <div className="form-group mb-2">
                  <label className="mx-2">Id:</label>
                  <Finput
                    type="text"
                    className="idField form-control"
                    control={c.fields.id}
                  />
                </div>
                <div className="form-group mb-2">
                  <label className="mx-2">Name:</label>
                  <Finput
                    type="text"
                    className="nameField form-control"
                    control={c.fields.name}
                  />
                </div>
                <div>
                  <button
                    className="btn mx-2 remove"
                    onClick={() => removeElement(fields.structured, idx)}
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
            onClick={() => addElement(fields.structured, defaultRow)}
          >
            Add
          </button>{" "}
          <button
            id="setObj"
            className="btn"
            onClick={() => {
              fields.structured.value = [
                { name: "Reset", id: "reset" },
                { id: "id", name: "Name" },
              ];
              fields.structured.markAsClean();
            }}
          >
            Reset
          </button>{" "}
          <button
            id="setDifferent"
            className="btn"
            onClick={() =>
              (fields.structured.value = [
                { name: "Reset", id: "reset" },
                { id: "id", name: "Name" },
                { id: "Another", name: "Righto" },
              ])
            }
          >
            Set different
          </button>{" "}
          <RenderControl>
            {() => (
              <span>
                Dirty:{" "}
                <span id="dirtyFlag">{fields.structured.dirty.toString()}</span>
              </span>
            )}
          </RenderControl>{" "}
          <RenderControl>
            {() => (
              <span>
                Valid:{" "}
                <span id="validFlag">{fields.structured.valid.toString()}</span>
              </span>
            )}
          </RenderControl>
        </div>
      </div>
      <div>
        <button
          id="toggleDisabled"
          className="btn btn-secondary"
          onClick={() => (formState.disabled = !formState.current.disabled)}
        >
          Toggle disabled
        </button>{" "}
        <button
          id="submit"
          className="btn btn-primary"
          onClick={() => setFormData(formState.current.value)}
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
