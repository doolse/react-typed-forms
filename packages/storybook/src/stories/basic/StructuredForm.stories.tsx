import {
  Finput,
  notEmpty,
  useControl,
  useControlEffect,
} from "@react-typed-forms/core";
import { Meta, StoryObj } from "@storybook/react";
import { useState } from "@storybook/preview-api";

// language=text
const exampleCode = `    
// Example code
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
`;

const meta: Meta<{}> = {
  title: "React typed forms/Basic/Structured Form",
  component: undefined,
  parameters: {
    docs: {
      description: {
        component: "Structured form descriptions",
      },
      source: {
        language: "tsx",
        code: exampleCode,
      },
    },
  },
};

export default meta;
type Story = StoryObj<{}>;

export const StructuredForm: Story = {
  render: () => {
    const formState = useControl(
      { firstName: "", lastName: "" },
      { fields: { lastName: { validator: notEmpty("Required field") } } },
    );
    const fields = formState.fields;
    const [formData, setFormData] = useState<SimpleForm>({
      firstName: "",
      lastName: "",
    });

    const updateTrigger = useControl(false);

    useControlEffect(
      () => updateTrigger.value,
      (v) => {
        if (v) {
          setFormData(formState.current.value);
          updateTrigger.value = false;
        }
      },
    );

    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          updateTrigger.value = true;
        }}
        className="flex flex-col gap-4"
      >
        <label>First Name</label>
        <Finput id="firstName" type="text" control={fields.firstName} />
        <label>Last Name *</label>
        <Finput id="lastName" type="text" control={fields.lastName} />
        <div>
          <button
            className="bg-primary-800 text-surface-100 rounded-full p-2"
            id="submit"
          >
            Validate and toObject()
          </button>
        </div>
        {formData && (
          <pre className="my-2">{JSON.stringify(formData, undefined, 2)}</pre>
        )}
      </form>
    );
  },
};
