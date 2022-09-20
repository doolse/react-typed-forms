import { FormArray, useControl } from "@react-typed-forms/core";
import { FNumberField, FTextField } from "@react-typed-forms/mui";
import React, { useState } from "react";

type Form = {
  firstName?: string;
  age?: number;
  nested?: {
    optional: string | undefined;
  };
  optionalStrings?: string[];
  optionalStructs?: { id: string };
};

export default function OptionalsTest() {
  const formState = useControl<Form>({
    nested: { optional: undefined },
  });
  const { fields } = formState;
  const [formData, setFormData] = useState<Form>();

  const nestedFields = fields.nested.fields;
  const optionalArray = fields.optionalStrings;
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
      {nestedFields && (
        <div>
          <FTextField
            id="optionalField"
            label="Optional"
            state={nestedFields.optional}
          />
        </div>
      )}
      <FormArray state={optionalArray}>
        {(elems) => (
          <>
            {elems.map((x) => (
              <div key={x.uniqueId}>
                <FTextField label="String elem" state={x} />
              </div>
            ))}
          </>
        )}
      </FormArray>
      <div>
        <button
          onClick={() => {
            optionalArray.add("");
          }}
        >
          Add optional string
        </button>
      </div>
      <div>
        <button
          id="clearStrings"
          className="btn btn-secondary"
          onClick={(e) => {
            e.preventDefault();
            formState.setValue({
              ...formState.value,
              optionalStrings: undefined,
            });
          }}
        >
          Clear strings
        </button>{" "}
        <button
          id="clearNested"
          className="btn btn-secondary"
          onClick={(e) => {
            e.preventDefault();
            formState.setValue({ ...formState.value, nested: undefined });
          }}
        >
          Clear nested
        </button>{" "}
        <button
          id="unClearNested"
          className="btn btn-secondary"
          onClick={(e) => {
            e.preventDefault();
            formState.setValue({
              ...formState.value,
              nested: { optional: "optional" },
            });
          }}
        >
          Unclear nested
        </button>{" "}
        <button
          id="resetData"
          className="btn btn-secondary"
          onClick={(e) => {
            e.preventDefault();
            formState.setValue({ nested: { optional: undefined } });
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
