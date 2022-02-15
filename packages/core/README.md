![npm](https://img.shields.io/npm/v/@react-typed-forms/core?style=plastic)

See the documentation [here](https://github.com/doolse/react-typed-forms#readme)

## Install

```npm
npm install @react-typed-forms/core
```

<!-- AUTO-GENERATED-CONTENT:START (CODE:src=../examples/src/pages/simple.tsx) -->
<!-- The below code snippet is automatically added from ../examples/src/pages/simple.tsx -->
```tsx
import { Finput, buildGroup, control } from "@react-typed-forms/core";
import { useState } from "react";
import React from "react";

interface SimpleForm {
  firstName: string;
  lastName: string;
}

const FormDef = buildGroup<SimpleForm>()({
  firstName: "",
  lastName: control("", (v) => (!v ? "Required field" : undefined)),
});

export default function SimpleExample() {
  const [formState] = useState(FormDef);
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
```
<!-- AUTO-GENERATED-CONTENT:END -->