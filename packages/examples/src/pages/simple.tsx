import {
  control,
  useNodeForDefinition,
  Finput,
  buildGroup,
} from "@react-typed-forms/core";
import { useState } from "react";
import React from "react";

type SimpleForm = {
  firstName: string;
  lastName: string;
};

const FormDef = buildGroup<SimpleForm>()({
  firstName: control(),
  lastName: control((v) => (!v ? "Required field" : undefined)),
});

export default function SimpleExample() {
  const formState = useNodeForDefinition(FormDef, {
    firstName: "",
    lastName: "",
  });
  const { fields } = formState;
  const [formData, setFormData] = useState<SimpleForm>();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setFormData(formState.toObject());
      }}
    >
      <label>First Name</label>
      <Finput id="firstName" type="text" state={fields.firstName} />
      <label>Last Name *</label>
      <Finput id="lastName" type="text" state={fields.lastName} />
      <div>
        <button id="submit">Validate and toObject()</button>
      </div>
      {formData && (
        <pre className="my-2">{JSON.stringify(formData, undefined, 2)}</pre>
      )}
    </form>
  );
}
