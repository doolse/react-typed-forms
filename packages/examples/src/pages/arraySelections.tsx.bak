import {
  arraySelectionControl,
  buildGroup,
  control,
  ControlType,
  Fcheckbox,
  Finput,
  FormSelectionArray,
  SelectionGroup,
  useControlStateComponent,
} from "@react-typed-forms/core";
import React, { useState } from "react";

interface FormData {
  people: RowForm[];
  other: string;
}

type RowForm = {
  first: string;
  last: string;
};

const selected: RowForm[] = [{ first: "Jolse", last: "Maginnis" }];

const allIds = ["Jolse", "Thomas", "Nicholas"];

const RowFormDef = buildGroup<RowForm>()({
  first: control("", (v) => (!v ? "Not blank" : undefined)),
  last: "",
});

const FormDef = buildGroup<FormData>()({
  other: "",
  people: arraySelectionControl(
    RowFormDef,
    (v) => v.first,
    (e) => e.fields.first.value,
    allIds.map((first) => ({ first, last: "" }))
  ),
});

let renders = 0;

export default function ArraySelectionsExample() {
  renders++;
  const [allFormState] = useState(() =>
    FormDef().setValue({ other: "HI", people: selected }, true)
  );
  const formState = allFormState.fields.people;
  const [formData, setFormData] = useState<RowForm[]>();
  const Dirty = useControlStateComponent(formState, (c) => {
    return c.dirty;
  });
  const Valid = useControlStateComponent(formState, (c) => c.valid);

  return (
    <div className="container">
      <h2>Array Selections Example - {renders} render(s)</h2>
      <div className="my-3">
        <h5>Structured elements</h5>
        <FormSelectionArray state={formState}>
          {(elems) =>
            elems.map((x, idx) => (
              <StructuredRow
                state={x}
                key={x.uniqueId}
                index={idx}
                onDelete={() => formState.underlying.remove(x)}
              />
            ))
          }
        </FormSelectionArray>
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
          onClick={() => {
            setFormData(formState.toArray());
          }}
        >
          toObject()
        </button>{" "}
        <button
          id="clean"
          className="btn btn-primary"
          onClick={() => formState.markAsClean()}
        >
          Mark Clean
        </button>{" "}
        <button
          id="setValue"
          className="btn btn-primary"
          onClick={() => formState.setValue([{ first: "Thomas", last: "" }])}
        >
          Set Value
        </button>
      </div>
      {formData && (
        <pre className="my-2">{JSON.stringify(formData, undefined, 2)}</pre>
      )}
    </div>
  );
}

function StructuredRow({
  state,
  index,
  onDelete,
}: {
  state: SelectionGroup<ControlType<typeof RowFormDef>>;
  index: number;
  onDelete: () => void;
}) {
  const c = state.fields.value.fields;
  return (
    <div className={`form-inline row_${index}`}>
      <div className="form-group mb-2">
        <label className="mx-2">Enabled:</label>
        <Fcheckbox state={state.fields.selected} className="enabled" />
      </div>
      <div className="form-group mb-2">
        <label className="mx-2">First:</label>
        <Finput
          type="text"
          className="firstField form-control"
          state={c.first}
        />
      </div>
      <div className="form-group mb-2">
        <label className="mx-2">Last:</label>
        <Finput type="text" className="lastField form-control" state={c.last} />
      </div>
      <div className="form-group mb-2">
        <button onClick={onDelete}>Delete</button>
      </div>
    </div>
  );
}
