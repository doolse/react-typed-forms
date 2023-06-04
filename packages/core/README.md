![npm](https://img.shields.io/npm/v/@react-typed-forms/core?style=plastic)

See the documentation [here](https://github.com/doolse/react-typed-forms#readme)

## Install

```npm
npm install @react-typed-forms/core
```

<!-- AUTO-GENERATED-CONTENT:START (CODE:src=../examples/src/pages/simple.tsx) -->
<!-- The below code snippet is automatically added from ../examples/src/pages/simple.tsx -->
```tsx
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