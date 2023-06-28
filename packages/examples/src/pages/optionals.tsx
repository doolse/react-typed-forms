import {
  addElement,
  RenderControl,
  RenderElements,
  RenderOptional,
  useControl,
} from "@react-typed-forms/core";
import { FNumberField, FTextField } from "@react-typed-forms/mui";
import React, { useState } from "react";

type Form = {
  firstName?: string;
  age?: number;
  nested?: {
    optional: string | undefined;
  };
  optionalStrings?: string[];
  nullableStruct: { id: string } | null;
};

export default function OptionalsTest() {
  const formState = useControl<Form>({
    nested: { optional: undefined },
    nullableStruct: null,
  });
  const fields = formState.fields;
  const [formData, setFormData] = useState<Form>();

  const nested = fields.nested;
  const optionalArray = fields.optionalStrings;
  const nullable = fields.nullableStruct;
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
      <RenderOptional control={nested}>
        {(c) => (
          <div>
            <FTextField
              id="optionalField"
              label="Optional"
              state={c.fields.optional}
            />
          </div>
        )}
      </RenderOptional>
      <RenderElements control={optionalArray}>
        {(x) => (
          <div>
            <FTextField label="String elem" state={x} />
          </div>
        )}
      </RenderElements>
      <div>
        <button
          onClick={() => {
            addElement(optionalArray, "");
          }}
        >
          Add optional string
        </button>
      </div>
      <RenderOptional
        control={nullable}
        children={(c) => (
          <div>
            <FTextField state={c.fields.id} label="Nullable" />
          </div>
        )}
      />
      <div>
        <button
          id="clearStrings"
          className="btn btn-secondary"
          onClick={(e) => {
            e.preventDefault();
            formState.setValue((v) => ({
              ...v,
              optionalStrings: undefined,
            }));
          }}
        >
          Clear strings
        </button>{" "}
        <button
          id="clearNested"
          className="btn btn-secondary"
          onClick={(e) => {
            e.preventDefault();
            formState.setValue((v) => ({ ...v, nested: undefined }));
          }}
        >
          Clear nested
        </button>{" "}
        <button
          id="unClearNested"
          className="btn btn-secondary"
          onClick={(e) => {
            e.preventDefault();
            formState.setValue((v) => ({
              ...v,
              nested: { optional: "optional" },
            }));
          }}
        >
          Unclear nested
        </button>{" "}
        <button
          id="resetData"
          className="btn btn-secondary"
          onClick={(e) => {
            e.preventDefault();
            formState.value = {
              nested: { optional: undefined },
              nullableStruct: null,
            };
          }}
        >
          Reset data
        </button>{" "}
        <button
          id="toggleNullable"
          className="btn btn-secondary"
          onClick={(e) => {
            e.preventDefault();
            formState.setValue((v) => ({
              ...v,
              nullableStruct: v.nullableStruct ? null : { id: "hi" },
            }));
          }}
        >
          Toggle nullable
        </button>{" "}
        <button
          id="submit"
          className="btn btn-primary"
          onClick={(e) => {
            setFormData(formState.current.value);
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
