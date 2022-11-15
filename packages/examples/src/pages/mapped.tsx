import {
  Control,
  getFields,
  Render,
  useComputed,
  useControl,
  usePreviousValue,
} from "@react-typed-forms/core";
import { FNumberField, FTextField } from "@react-typed-forms/mui";
import React from "react";

interface FullGroup {
  firstName: string;
  age: number;
  anotherField: string;
}

export default function MappedTest() {
  console.log("Mapped Test");
  const formState = useControl<FullGroup>({
    age: 0,
    firstName: "",
    anotherField: "",
  });
  const fields = getFields(formState);
  const subForm = useComputed(() => ({
    age: fields.age.value,
    firstName: fields.firstName.value.toUpperCase(),
  }));

  const combined = useComputed(
    () =>
      `${getFields(subForm).firstName.value} is ${
        getFields(subForm).age.value
      } years old`
  );

  const selected = useControl<Control<any>>(fields.firstName);
  const previousValueControl = usePreviousValue(formState);
  return (
    <div className="container">
      <h2>Mapped control test</h2>
      <div>
        <FTextField
          label="First Name"
          id="firstName"
          state={fields.firstName}
        />
        <button id="sel1" onClick={() => selected.setValue(fields.firstName)}>
          Select
        </button>
      </div>
      <div>
        <FTextField
          label="Another field"
          id="anotherField"
          state={fields.anotherField}
        />
        <button
          id="sel2"
          onClick={() => selected.setValue(fields.anotherField)}
        >
          Select
        </button>
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
      <Render
        children={() => (
          <pre id="mappedJson">{JSON.stringify(subForm.value, null, 2)}</pre>
        )}
      />
      <Render
        children={() => (
          <pre id="mappedJson2">{JSON.stringify(combined.value, null, 2)}</pre>
        )}
      />
      <Render
        children={() => (
          <pre id="selectedValue">{JSON.stringify(selected.value.value)}</pre>
        )}
      />
      <Render
        children={() => (
          <pre id="previousValue">
            {JSON.stringify(previousValueControl.value, null, 2)}
          </pre>
        )}
      />
    </div>
  );
}
