import {
  ControlSetup,
  Finput,
  notEmpty,
  RenderControl,
  useControl,
} from "@react-typed-forms/core";
import React, { useState } from "react";

interface SimpleForm {
  firstName: string;
  lastName: string;
}

const initialForm: SimpleForm = { firstName: "", lastName: "" };

const formSetup: ControlSetup<SimpleForm> = {
  fields: { lastName: { validator: notEmpty("Required field") } },
};

export default function SimpleExample() {
  const formState = useControl<SimpleForm>(initialForm, formSetup);
  const fields = formState.fields;

  return (
    <div>
      <Finput type="text" state={fields.firstName} />
      <Finput type="text" state={fields.lastName} />
    </div>
  );
}

function AnotherExample() {
  const formState = useControl(initialForm, formSetup);
  // ...render form...
  return (
    <RenderControl>
      {() => (
        <button disabled={!formState.valid} onClick={() => save()}>
          Save
        </button>
      )}
    </RenderControl>
  );

  function save() {}
}
