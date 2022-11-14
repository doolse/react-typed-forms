import {
  Control,
  getFields,
  mappedWith,
  useControl,
  useControlStateComponent,
  useFlattenedControl,
  useMappedControl,
  useMappedControls,
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
  const formState = useControl<FullGroup>({
    age: 0,
    firstName: "",
    anotherField: "",
  });
  const fields = getFields(formState);
  const subForm = useMappedControls({
    age: fields.age,
    firstName: mappedWith(fields.firstName, (c) => c.value.toUpperCase()),
  });

  const combined = useMappedControl(
    subForm,
    ({ value: { firstName, age } }) => `${firstName} is ${age} years old`
  );

  const MappedValues = useControlStateComponent(subForm, (c) => c.value);
  const MappedValue = useControlStateComponent(combined, (c) => c.value);
  const selected = useControl<Control<any>>(fields.firstName);
  const FlattenedValue = useControlStateComponent(
    useFlattenedControl(selected),
    (c) => c.value
  );
  const PreviousValue = useControlStateComponent(
    usePreviousValue(formState),
    (c) => c.value
  );
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
      <MappedValues
        children={(v) => (
          <pre id="mappedJson">{JSON.stringify(v, null, 2)}</pre>
        )}
      />
      <MappedValue
        children={(v) => (
          <pre id="mappedJson2">{JSON.stringify(v, null, 2)}</pre>
        )}
      />
      <FlattenedValue
        children={(c) => <pre id="selectedValue">{JSON.stringify(c)}</pre>}
      />
      <PreviousValue
        children={(c) => (
          <pre id="previousValue">{JSON.stringify(c, null, 2)}</pre>
        )}
      />
    </div>
  );
}
