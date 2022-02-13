import {
  arrayControl,
  buildGroup,
  control,
  ControlType,
  Fcheckbox,
  Finput,
  FormArray,
  useControlStateComponent,
  arraySelectionControl,
  SelectionGroup,
} from "@react-typed-forms/core";
import React, { useState } from "react";

type RowForm = {
  first: string;
  last: string;
};
const RowFormDef = buildGroup<RowForm>()({
  first: control("", (v) => (!v ? "Not blank" : undefined)),
  last: "",
});

let renders = 0;

export default function ExclusionsExample() {
  renders++;
  const [formState] = useState(() =>
    arraySelectionControl(
      RowFormDef,
      (v, g) => g.fields.first.value === v.first
    )()
      .setSelectionValue(
        allIds.map((x) => ({
          enabled: false,
          value: { first: x, last: "" },
        })),
        true
      )
      .setValue(selected, true)
  );
  const [formData, setFormData] = useState<RowForm[]>();
  const Dirty = useControlStateComponent(formState, (c) => {
    return c.dirty;
  });
  const Valid = useControlStateComponent(formState, (c) => c.valid);

  return (
    <div className="container">
      <h2>Exclusions Example - {renders} render(s)</h2>
      <div className="my-3">
        <h5>Structured elements</h5>
        <FormArray state={formState}>
          {(elems) =>
            elems.map((x, idx) => (
              <StructuredRow state={x} key={x.uniqueId} index={idx} />
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
}: {
  state: SelectionGroup<ControlType<typeof RowFormDef>>;
  index: number;
}) {
  const c = state.fields.value.fields;
  return (
    <div className={`form-inline row_${index}`}>
      <div className="form-group mb-2">
        <label className="mx-2">Enabled:</label>
        <Fcheckbox state={state.fields.enabled} className="enabled" />
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
    </div>
  );
}

const selected: RowForm[] = [{ first: "Jolse", last: "Maginnis" }];

const allIds = ["Jolse", "Thomas", "Nicholas"];
