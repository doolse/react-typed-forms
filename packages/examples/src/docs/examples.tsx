import {
  control,
  ControlChange,
  ControlType,
  Finput,
  groupControl,
  useControlStateComponent,
  ValueTypeForControl,
} from "@react-typed-forms/core";
import React, { useState } from "react";

const FormDef = groupControl({
  firstName: "",
  lastName: control("", (v) => (!v ? "Required field" : undefined)),
});

type SimpleForm = ValueTypeForControl<ControlType<typeof FormDef>>;

export default function SimpleExample() {
  const [formState] = useState(FormDef);
  const { fields } = formState;

  return (
    <div>
      <Finput type="text" state={formState.fields.firstName} />
      <Finput type="text" state={formState.fields.lastName} />
    </div>
  );
}

function AnotherExample() {
  const [formState] = useState(FormDef);
  const FormValid = useControlStateComponent(
    formState,
    (c) => c.valid,
    ControlChange.Valid
  );
  // ...render form...
  return (
    <FormValid>
      {(formValid) => (
        <button disabled={!formValid} onClick={() => save()}>
          Save
        </button>
      )}
    </FormValid>
  );

  function save() {}
}
