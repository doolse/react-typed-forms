import { buildGroup, control, groupControl } from "@react-typed-forms/core";
import { FNumberField, FTextField } from "@react-typed-forms/mui";
import React, { useState } from "react";

type Form = {
  firstName?: string;
  age?: number;
  nested?: {
    optional: string | undefined;
  };
};

const adef = {
  firstName: "",
  age: 0,
  nested: groupControl({ optional: control<string | undefined>("") }),
};

const FormDef = buildGroup<Form>()(adef);

export default function OptionalsTest() {
  const [formState] = useState(() => FormDef().setValue({ nested: {} }, true));
  const { fields } = formState;
  const [formData, setFormData] = useState<Form>();

  return (
    <div className="container">
      <h2>Optionals Test</h2>
      <div>
        <FTextField
          label="First Name"
          id="firstName"
          state={fields.firstName}
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
            formState.setValue({ nested: {} });
          }}
        >
          Reset data
        </button>{" "}
        <button
          id="submit"
          className="btn btn-primary"
          onClick={(e) => {
            setFormData(formState.toObject());
            e.preventDefault();
          }}
        >
          toObject()
        </button>
      </div>
      {formData && (
        <pre className="my-2">{JSON.stringify(formData, undefined, 2)}</pre>
      )}
    </div>
  );
}
