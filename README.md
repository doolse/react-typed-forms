![npm](https://img.shields.io/npm/v/@react-typed-forms/core?style=plastic)

# React typed forms

Yes, another form library for React. **Why?**

To take advantage of Typescript's advanced type system (v4.1) to give you more safety and a nice dev experience within your IDE.

Other reasons to use this library:

- [Zero re-rendering](packages/examples/src/pages/basic.tsx) of parent components
- Easy validation including [async validators](packages/examples/src/pages/validation.tsx)
- Standard form related state (valid, disabled, dirty, touched, error string)
- [Arrays](packages/examples/src/pages/arrays.tsx) and nested forms
- Zero dependencies besides React
- [MUI](https://material-ui.com/) TextField binding

## Install

```npm
npm install @react-typed-forms/core
```

## Simple example

<!-- AUTO-GENERATED-CONTENT:START (CODE:src=./packages/examples/src/pages/simple.tsx) -->
<!-- The below code snippet is automatically added from ./packages/examples/src/pages/simple.tsx -->
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

## Define your form

In order to render your form you first need to define it's structure, default values and validators.

The function `buildGroup<T>()` can be used to create a definition that matches the structure of your form data type. This comes in handy when you are creating forms based on types which are generated from a swagger or OpenAPI definition.

<!-- AUTO-GENERATED-CONTENT:START (CODE:src=./packages/examples/src/pages/simple.tsx&lines=5-14) -->
<!-- The below code snippet is automatically added from ./packages/examples/src/pages/simple.tsx -->
```tsx
  firstName: string;
  lastName: string;
}

export default function SimpleExample() {
  const formState = useControl(
    { firstName: "", lastName: "" },
    { fields: { lastName: { validator: notEmpty("Required field") } } }
  );
  const fields = formState.fields;
```
<!-- AUTO-GENERATED-CONTENT:END -->

`control<V>(defaultValue)` is used to define a control which holds a single immutable value of type V. When used within `buildGroup` the type will be inferred.

Instead of starting with a datatype and checking the form structure, you can also go with a form first approach:

<!-- AUTO-GENERATED-CONTENT:START (CODE:src=./packages/examples/src/docs/examples.tsx&lines=12-18) -->
<!-- The below code snippet is automatically added from ./packages/examples/src/docs/examples.tsx -->
```tsx
  firstName: "",
  lastName: control("", (v) => (!v ? "Required field" : undefined)),
});

type SimpleForm = ValueTypeForControl<ControlType<typeof FormDef>>;

export default function SimpleExample() {
```
<!-- AUTO-GENERATED-CONTENT:END -->

## Render your form

With the form defined you need to initialise it within your component by using the `useState()` hook:

<!-- AUTO-GENERATED-CONTENT:START (CODE:src=./packages/examples/src/pages/simple.tsx&lines=16-16) -->
<!-- The below code snippet is automatically added from ./packages/examples/src/pages/simple.tsx -->
```tsx
  return (
```
<!-- AUTO-GENERATED-CONTENT:END -->

This will return an instance of `GroupControl` which has a `fields` property which contains `FormControl` instances.

The core library contains an `<input>` renderer for `FormControl` called `Finput` which uses html5's custom validation feature to show errors.

<!-- AUTO-GENERATED-CONTENT:START (CODE:src=./packages/examples/src/docs/examples.tsx&lines=23-28) -->
<!-- The below code snippet is automatically added from ./packages/examples/src/docs/examples.tsx -->
```tsx
    <div>
      <Finput type="text" state={fields.firstName} />
      <Finput type="text" state={fields.lastName} />
    </div>
  );
}
```
<!-- AUTO-GENERATED-CONTENT:END -->

There is also a small library [(@react-typed-forms/mui)](packages/mui/src/index.tsx) which has some renderers for the [MUI](https://material-ui.com/) `TextField` component.

## Rendering

Creating renderers for a `FormControl` is very easy, it's a simple matter of using a hook function to register change listeners.

The easiest way is to just use `useControlStateVersion()` to trigger a re-render whenever any change that needs to be re-rendered occurs.

The most low level change listener hook is `useControlChangeEffect()` which just runs an effect function for the given change types.

Let's take a possible implementation `Finput` implementation which uses both:

<!-- AUTO-GENERATED-CONTENT:START (CODE:src=./packages/examples/src/docs/Finput.tsx&lines=8-100) -->
<!-- The below code snippet is automatically added from ./packages/examples/src/docs/Finput.tsx -->
```tsx
  };

export function Finput<V extends string | number>({
  state,
  ...others
}: FinputProps<V>) {
  // Update the HTML5 custom validity whenever the error message is changed/cleared
  useControlEffect(
    () => state.error,
    (s) => (state.element as HTMLInputElement)?.setCustomValidity(s ?? "")
  );
  return (
    <RenderForm
      control={state}
      children={({ errorText, ...theseProps }) => (
        <input
          {...theseProps}
          ref={(r) => {
            state.element = r;
            if (r) r.setCustomValidity(state.error ?? "");
          }}
          {...others}
        />
      )}
    />
  );
}
```
<!-- AUTO-GENERATED-CONTENT:END -->

## Other listener hooks

### `useAsyncValidator()`

If you need complex validation which requires calling a web service, call `useAsyncValidator()` with your validation callback which returns a `Promise` with the error message (or null/undefined for valid). You also pass in a debounce time in milliseconds, so that you don't validate on each keypress.

### `useControlValue()`

If you need to re-render part of a component based on the value of a `FormComponent`, use the `userControlValue()` hook:

<!-- AUTO-GENERATED-CONTENT:START (CODE:src=./packages/examples/src/docs/useControlValue.tsx&lines=4-100) -->
<!-- The below code snippet is automatically added from ./packages/examples/src/docs/useControlValue.tsx -->
```tsx
  const titleField = useControl("");
  const title = useControlValue(titleField);
  return (
    <div>
      Title: <Finput state={titleField} type="text" />
      <br />
      <h1>The title is {title}</h1>
    </div>
  );
}
```
<!-- AUTO-GENERATED-CONTENT:END -->

### `useControlState()`

A common scenario for forms is that you'd like to have a Save button which is disabled when the form is invalid.

```tsx
import {useControlChangeEffect} from "@react-typed-forms/core";

const [formValid, setFormValid] = useState(formState.valid);
useControlChangeEffect(formState, () => setFormValid(formState.valid), ControlChange.Valid);

//...render form...
<button disabled={!formValid} onClick={() => save()}>Save</button>
```

`useControlState()` handles the state updates for you so you could replace the above code with:

```ts
const formValid = useControlState(formState, (c) => c.valid, ControlChange.Valid);
```

*NOTE:* `useControlValue` is just `useControlState` using the `value`.

### `useControlStateComponent()`

The only downside to `useControlState()` is that you will be re-rendering the whole component, 
which usually won't matter if it's not too complicated but we can do better.

`useControlStateComponent()` creates a component which takes a function that passes in the 
computed state value and only renders that when it changes.

```tsx
const FormValid = useControlStateComponent(formState, (c) => c.valid, ControlChange.Valid);
// ...render form...
<FormValid>
    {(formValid) => (
        <button disabled={!formValid} onClick={() => save()}>
            Save
        </button>
    )}
</FormValid>
```
