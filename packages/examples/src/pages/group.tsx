import {
  buildGroup,
  ControlChange,
  GroupControl,
  useControlChangeEffect,
} from "@react-typed-forms/core";
import { FNumberField, FTextField } from "@react-typed-forms/mui";
import React, { useMemo, useState } from "react";

interface FullGroup {
  firstName: string;
  age: number;
  anotherField: string;
}

const FormDef = buildGroup<FullGroup>()({
  age: 0,
  firstName: "",
  anotherField: "",
});

export default function GroupTest() {
  const [formState] = useState(FormDef);
  const { fields } = formState;
  const subForm = useMemo(
    () =>
      formState.subGroup(({ age, firstName }) => ({
        age,
        firstName,
      })),
    [formState]
  );
  const [parentUpdates, setParentUpdates] = useState(0);
  const [valueUpdates, setValueUpdates] = useState(0);

  useControlChangeEffect(
    subForm,
    () => setValueUpdates((x) => x + 1),
    ControlChange.Value
  );
  useControlChangeEffect(
    formState,
    () => setParentUpdates((x) => x + 1),
    ControlChange.Value
  );

  return (
    <div className="container">
      <h2>Group Test</h2>
      <div>
        <FTextField
          label="First Name"
          id="firstName"
          state={fields.firstName}
        />
      </div>
      <div>
        <FTextField
          label="Another field"
          id="anotherField"
          state={fields.anotherField}
        />
      </div>
      <div>
        <FNumberField id="age" label="Age" state={fields.age} />
      </div>
      <div>
        SubGroup updates: <span id="updateCount">{valueUpdates}</span>
      </div>
      <div>
        Parent updates: <span id="updateParentCount">{parentUpdates}</span>
      </div>
      <div>
        <button
          id="resetData"
          className="btn btn-secondary"
          onClick={(e) => {
            e.preventDefault();
            formState.setValue({
              age: 10,
              anotherField: "WOW",
              firstName: "Reset",
            });
          }}
        >
          Reset data
        </button>
        <button
          id="resetSubData"
          className="btn btn-secondary"
          onClick={(e) => {
            e.preventDefault();
            subForm.setValue({
              age: 5,
              firstName: "cool",
            });
          }}
        >
          Reset Sub data
        </button>
      </div>
    </div>
  );
}
