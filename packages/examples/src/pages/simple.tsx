import { Finput, notEmpty, useControl } from "@react-typed-forms/core";
import React, { useState } from "react";

interface SimpleForm {
  firstName: string;
  lastName: string;
}

export default function SimpleExample() {
  const formState = useControl(
    { firstName: "", lastName: "" },
    { fields: { lastName: { validator: notEmpty("Required field") } } }
  );
  const fields = formState.fields;
  const [formData, setFormData] = useState<SimpleForm>();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setFormData(formState.current.value);
      }}
    >
      <label>First Name</label>
      <Finput id="firstName" type="text" control={fields.firstName} />
      <label>Last Name *</label>
      <Finput id="lastName" type="text" control={fields.lastName} />
      <div>
        <button id="submit">Validate and toObject()</button>
      </div>
      {formData && (
        <pre className="my-2">{JSON.stringify(formData, undefined, 2)}</pre>
      )}
    </form>
  );
}
