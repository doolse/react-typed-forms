import {
  arrayControl,
  buildGroup,
  control,
  ControlType,
  Fcheckbox,
  Finput,
  useControlIncluded,
  useControlStateComponent,
} from "@react-typed-forms/core";
import React, { useState } from "react";

type RowForm = {
  id: string;
  name: string;
};
const RowFormDef = buildGroup<RowForm>()({
  id: control("", (v) => (!v ? "Not blank" : undefined)),
  name: "",
});

let renders = 0;

export default function ArraysExample() {
  renders++;
  const [formState] = useState(() =>
    arrayControl(RowFormDef)().setValue(selected)
  );
  const [formData, setFormData] = useState<RowForm[]>();
  const Dirty = useControlStateComponent(formState, (c) => {
    return c.dirty;
  });
  const Valid = useControlStateComponent(formState, (c) => c.valid);

  return (
    <div className="container">
      <h2>Arrays Example - {renders} render(s)</h2>
      <div className="my-3">
        <h5>Structured elements</h5>
        {allIds.map((i) => {
          const ctrl = formState.findOrAdd(
            (x) => x.fields.id.value === i,
            (c) => c.setValue({ id: i, name: "" })
          );
          return <StructuredRow state={ctrl} key={ctrl.uniqueId} />;
        })}
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
          onClick={() => setFormData(formState.toArray())}
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

function StructuredRow({
  state: ctrl,
}: {
  state: ControlType<typeof RowFormDef>;
}) {
  const checked = useControlIncluded(ctrl);
  const c = ctrl.fields;
  return (
    <div key={ctrl.uniqueId} className="form-inline">
      <div className="form-group mb-2">
        <label className="mx-2">Enabled:</label>
        <Fcheckbox state={checked} />
      </div>
      <div className="form-group mb-2">
        <label className="mx-2">Id:</label>
        <Finput type="text" className="idField form-control" state={c.id} />
      </div>
      <div className="form-group mb-2">
        <label className="mx-2">Name:</label>
        <Finput type="text" className="nameField form-control" state={c.name} />
      </div>
    </div>
  );
}

const selected: RowForm[] = [{ id: "Jolse", name: "Maginnis" }];

const allIds = ["Jolse", "Thomas", "Nicholas"];
