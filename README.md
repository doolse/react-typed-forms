![npm](https://img.shields.io/npm/v/@react-typed-forms/core?style=plastic)

# React typed forms

Yes, another form library for React. **Why?**

To take advantage of Typescript's advanced type system to give you more safety and a nice dev experience within your IDE.

- [Signals](https://preactjs.com/guide/v10/signals/) style reactive programming
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

## Declare a Control

A `Control` is essentially an advanced [signal](https://preactjs.com/guide/v10/signals/) with additional state for tracking form metadata (valid, disabled, dirty, touched and an error message) 
and the ability to treat object fields and array elements as a child `Control`.   

<!-- AUTO-GENERATED-CONTENT:START (CODE:src=./packages/examples/src/pages/simple.tsx&lines=4-14) -->
<!-- The below code snippet is automatically added from ./packages/examples/src/pages/simple.tsx -->
```tsx
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
```
<!-- AUTO-GENERATED-CONTENT:END -->

`useControl<V>(initialValue, controlSetup?)` is used to define a control which holds an immutable value of type V.

Because `formState` is a `Control` which holds a value of type `SimpleForm`, you can access child `Control`s by using it's `fields` property.

<!-- AUTO-GENERATED-CONTENT:START (CODE:src=./packages/examples/src/pages/simple.tsx&lines=23-26) -->
<!-- The below code snippet is automatically added from ./packages/examples/src/pages/simple.tsx -->
```tsx
      <label>First Name</label>
      <Finput id="firstName" type="text" state={fields.firstName} />
      <label>Last Name *</label>
      <Finput id="lastName" type="text" state={fields.lastName} />
```
<!-- AUTO-GENERATED-CONTENT:END -->

`Finput` is a simple wrapper component around the standard DOM `input` tag, which supports showing validation errors with HTML5 setCustomValidity.. 
The important thing to note here is that the parent component will not need to be re-rendered while typing, as would be needed with the standard useState() style form rendering.

Along with `Finput`, the core library provides `Fselect` and `Fcheckbox`. There is also a small library [(@react-typed-forms/mui)](packages/mui/src/index.tsx) which has renderers for various [MUI](https://material-ui.com/) components.

## Rendering with Controls

Custom rendering of a `Control` boils down to the `useControlValue()` hook primitive. 
It takes a function which returns a value which can be computed using any of the `Control`s 'tracked' properties. 
For example let's save you didn't want users to be able to click the save button unless they'd changed the data in the form and the form was valid, you could do this: 

```tsx
const form = useControl({firstName: "Joe", lastName: "Blogs"});
const canSave = useControlValue(() => form.valid && form.dirty);
...
<button disabled={!canSave}>Save</button>
```

The react component which uses `useControlValue()` will re-render whenever the value returned from the callback changes, and that value will be re-computed whenever any of the requested properties changes 
(in this case the valid and dirty flags).

`useControlValue()` also has a version which just takes a single control and is the equivalent of using `() => control.value`.

```tsx
const countControl = useControl(0);
const currentCount = useControlValue(countControl);
```

The trouble with using `useControlValue()` is that it will still re-render the whole component, much like standard `useState()` does, whereas often the computed value may only affect a small part of the components rendering. 
The solution in this case is to use the `RenderControl` component. Which is a simple wrapper around `useControlValue` which allows you to only re-render what you need:
```tsx
<RenderControl>{() => <button disabled={!form.valid || !form.dirty}>Save</button>}</RenderControl>
```

## Control Effects

You can run effects directly from changes to `Control`s by using the `useControlEffect()`.
TODO

## Validation
TODO

## Other hooks

### `useAsyncValidator()`

If you need complex validation which requires calling a web service, call `useAsyncValidator()` with your validation callback which returns a `Promise` with the error message (or null/undefined for valid). You also pass in a debounce time in milliseconds, so that you don't validate on each keypress.

TODO
