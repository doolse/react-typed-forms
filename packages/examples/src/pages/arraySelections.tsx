import {
  Control,
  ensureSelectableValues,
  Fcheckbox,
  Finput,
  notEmpty,
  removeElement,
  RenderElements,
  SelectionGroup,
  useControl,
  useControlValue,
  useSelectableArray,
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

const allDefaults: RowForm[] = ["Jolse", "Thomas", "Nicholas"].map((x) => ({
  first: x,
  last: "",
}));

export default function ArraySelectionsExample() {
  const renders = useControlValue<number>((p) => (p ?? 0) + 1);
  const allFormState = useControl<FormData>(
    { other: "HI", people: selected },
    {
      fields: {
        people: {
          elems: { fields: { first: { validator: notEmpty("Please enter") } } },
        },
      },
    },
  );
  const [reset, setReset] = useState(0);
  const formState = useSelectableArray(
    allFormState.fields.people,
    ensureSelectableValues(allDefaults, (x) => x.first),
    undefined,
    reset,
  );
  const [formData, setFormData] = useState<RowForm[]>();
  return (
    <div className="container">
      <h2>Array Selections Example - {renders} render(s)</h2>
      <div className="my-3">
        <h5>Structured elements</h5>
        <RenderElements control={formState}>
          {(x, idx) => (
            <StructuredRow
              state={x}
              key={x.uniqueId}
              index={idx}
              onDelete={() => removeElement(formState, x)}
            />
          )}
        </RenderElements>
        <span>
          Dirty: <span id="dirtyFlag">{allFormState.dirty.toString()}</span>
        </span>
        <span>
          Valid: <span id="validFlag">{allFormState.valid.toString()}</span>
        </span>
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
          onClick={() => {
            setFormData(allFormState.fields.people.current.value);
          }}
        >
          toObject()
        </button>{" "}
        <button
          id="clean"
          className="btn btn-primary"
          onClick={() => {
            allFormState.markAsClean();
          }}
        >
          Mark Clean
        </button>{" "}
        <button
          id="setValue"
          className="btn btn-primary"
          onClick={() => {
            allFormState.fields.people.value = [
              { first: "Thomas", last: "" },
              { first: "Derek", last: "Chongster" },
            ];
            setReset((x) => x + 1);
          }}
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
  state: Control<SelectionGroup<RowForm>>;
  index: number;
  onDelete: () => void;
}) {
  const c = state.fields.value.fields;
  return (
    <div className={`form-inline row_${index}`}>
      <div className="form-group mb-2">
        <label className="mx-2">Enabled:</label>
        <Fcheckbox control={state.fields.selected} className="enabled" />
      </div>
      <div className="form-group mb-2">
        <label className="mx-2">First:</label>
        <Finput
          type="text"
          className="firstField form-control"
          control={c.first}
        />
      </div>
      <div className="form-group mb-2">
        <label className="mx-2">Last:</label>
        <Finput
          type="text"
          className="lastField form-control"
          control={c.last}
        />
      </div>
      <div className="form-group mb-2">
        <button onClick={onDelete}>Delete</button>
      </div>
    </div>
  );
}
