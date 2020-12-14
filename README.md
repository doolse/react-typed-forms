# React typed forms

Yes, another form library for React. **Why?**

To take advantage of Typescript's advanced type system to give you more safety and a nice dev experience within your IDE.

Other reasons to use this library:

- Zero re-rendering of parent components
- Easy validation including async validators.
- Standard form/related state (disabled, dirty, show validatons, error message).
- Zero dependencies besides React.
- MUI binding

## Let's go

```tsx
import { formGroup, ctrl, useFormState, Finput } from "@react-typed-forms/core";
import { useState } from "react";
import React from "react";

type SimpleForm = {
  firstName: string;
  lastName: string;
};

const FormDef = formGroup<SimpleForm>()({
  firstName: ctrl(),
  lastName: ctrl((v) => (!v ? "Required field" : undefined)),
});

export function SimpleExample() {
  const formState = useFormState(FormDef, { firstName: "", lastName: "" });
  const { fields } = formState;
  const [formData, setFormData] = useState<SimpleForm>();
  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setFormData(formState.toObject());
        }}
      >
        <label>First Name</label>
        <Finput type="text" state={fields.firstName} />
        <label>Last Name *</label>
        <Finput type="text" state={fields.lastName} />
        <div>
          <button>Validate and toObject()</button>
        </div>
        {formData && (
          <pre className="my-2">{JSON.stringify(formData, undefined, 2)}</pre>
        )}
      </form>
    </div>
  );
}
```
