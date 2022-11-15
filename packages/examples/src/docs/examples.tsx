import {
  control,
  ControlType,
  Finput,
  getFields,
  groupControl,
  Render,
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
  const fields = getFields(formState);

  return (
    <div>
      <Finput type="text" state={fields.firstName} />
      <Finput type="text" state={fields.lastName} />
    </div>
  );
}

function AnotherExample() {
  const [formState] = useState(FormDef);
  // ...render form...
  return (
    <Render>
      {() => (
        <button disabled={!formState.valid} onClick={() => save()}>
          Save
        </button>
      )}
    </Render>
  );

  function save() {}
}
