import {
  ControlChange,
  getFields,
  useControl,
  useControlEffect,
  useControlGroup,
  useValueChangeEffect,
} from "@react-typed-forms/core";
import { FNumberField, FTextField } from "@react-typed-forms/mui";
import React, { useState } from "react";

interface FullGroup {
  firstName: string;
  age: number;
  anotherField: string;
}

export default function GroupTest() {
  const formState = useControl<FullGroup>({
    age: 0,
    firstName: "",
    anotherField: "",
  });
  const fields = getFields(formState);
  const subForm = useControlGroup({
    age: fields.age,
    firstName: fields.firstName,
  });
  const [parentUpdates, setParentUpdates] = useState(0);
  const [valueUpdates, setValueUpdates] = useState(0);
  const [debouncedUpdates, setDebouncedUpdates] = useState(0);

  useControlEffect(
    () => subForm.value,
    () => setValueUpdates((x) => x + 1)
  );
  useControlEffect(
    () => formState.value,
    () => setParentUpdates((x) => x + 1)
  );
  useValueChangeEffect(subForm, () => setDebouncedUpdates((x) => x + 1), 1000);

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
        Debounced subgroup updates:{" "}
        <span id="updateDebouncedCount">{debouncedUpdates}</span>
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
