import {
  createSelectableArray,
  defineElements,
  defineFields,
  Fcheckbox,
  Finput,
  FormArray,
  FormControl,
  notEmpty,
  SelectionGroup,
  useControl,
  useControlStateComponent,
  validated,
} from "@react-typed-forms/core";
import React, { useMemo, useState } from "react";

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

let renders = 0;

export default function ArraySelectionsExample() {
  renders++;
  const allFormState = useControl<FormData>(
    { other: "HI", people: selected },
    defineFields({
      people: (c) =>
        c.withElements(
          defineFields({ first: validated(notEmpty("Please enter")) })
        ),
    })
  );
  const formState = useMemo(
    () =>
      createSelectableArray(
        allFormState.fields.people,
        allIds.map((x) => ({ first: x, last: "" })),
        (v) => v.first
      ),
    [allFormState]
  );
  const [formData, setFormData] = useState<RowForm[]>();
  const Dirty = useControlStateComponent(allFormState, (c) => {
    return c.dirty;
  });
  const Valid = useControlStateComponent(allFormState, (c) => c.valid);

  return (
    <div className="container">
      <h2>Array Selections Example - {renders} render(s)</h2>
      <div className="my-3">
        <h5>Structured elements</h5>
        <FormArray state={formState}>
          {(elems) =>
            elems.map((x, idx) => (
              <StructuredRow
                state={x}
                key={x.uniqueId}
                index={idx}
                onDelete={() => formState.remove(x)}
              />
            ))
          }
        </FormArray>
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
            setFormData(allFormState.fields.people.toArray());
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
          onClick={() =>
            allFormState.fields.people.setValue([
              { first: "Thomas", last: "" },
              { first: "Derek", last: "Chongster" },
            ])
          }
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
  state: FormControl<SelectionGroup<RowForm>>;
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
