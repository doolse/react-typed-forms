import {
  ControlChange,
  mappedWith,
  useControl,
  useControlChangeEffect,
  useControlStateComponent,
  useMappedControls,
  useValueChangeEffect,
} from "@react-typed-forms/core";
import { FNumberField, FTextField } from "@react-typed-forms/mui";
import React, { useState } from "react";

interface FullGroup {
  firstName: string;
  age: number;
  anotherField: string;
}

export default function MappedTest() {
  const formState = useControl<FullGroup>({
    age: 0,
    firstName: "",
    anotherField: "",
  });
  const { fields } = formState;
  const subForm = useMappedControls({
    age: fields.age,
    firstName: mappedWith(fields.firstName, (c) => c.value.toUpperCase()),
  });

  const MappedValues = useControlStateComponent(subForm, (c) => c.value);

  return (
    <div className="container">
      <h2>Mapped control test</h2>
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
      <MappedValues
        children={(v) => (
          <pre id="mappedJson">{JSON.stringify(v, null, 2)}</pre>
        )}
      />
    </div>
  );
}
