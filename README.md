![npm](https://img.shields.io/npm/v/@react-typed-forms/core?style=plastic)

# React typed forms

Yes, another form library for React. **Why?**

To take advantage of Typescript's advanced type system to give you more safety and a nice dev experience within your IDE.

Other reasons to use this library:

- [Zero re-rendering](packages/examples/basic.tsx) of parent components
- Easy validation including [async validators](packages/examples/validation.tsx)
- Standard form related state (valid, disabled, dirty, touched, error string)
- [Arrays](packages/example/arrays.tsx) and nested forms
- Zero dependencies besides React
- [MUI](https://material-ui.com/) TextField binding

## Install

```npm
npm install @react-typed-forms/core
```

## Simple example

```tsx
import {
  control,
  useFormState,
  Finput,
  buildGroup,
} from "@react-typed-forms/core";
import { useState } from "react";
import React from "react";

type SimpleForm = {
  firstName: string;
  lastName: string;
};

const FormDef = buildGroup<SimpleForm>()({
  firstName: control(),
  lastName: control((v) => (!v ? "Required field" : undefined)),
});

export function SimpleExample() {
  const formState = useFormState(FormDef, { firstName: "", lastName: "" });
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
  );
}
```

## Define your form

In order to render your form you first need to define it's structure and validators.

The function `buildGroup<T>()` can be used to create a definition that matches the structure of your form data type. This comes in handy when you are creating forms based on types which are generated from a swagger or OpenAPI definition.

```tsx
type SimpleForm = {
  firstName: string;
  lastName: string;
};

const FormDef = buildGroup<SimpleForm>()({
  firstName: control(),
  lastName: control((v) => (!v ? "Required field" : undefined)),
});
```

`control<V>()` is used to define a control which holds a single immutable value of type V. When used within `buildGroup` the type will be inferred.

Instead of starting with a datatype and checking the form structure, you can also go with a form first approach:

```tsx
const FormDef = formGroup({
  firstName: control<string>(),
  lastName: control<string>((v) => (!v ? "Required field" : undefined)),
});

type SimpleForm = FormDataType<typeof FormDef>;
```

## Render your form

With the form defined you need to initialise it within your component by using the `useFormState()` hook:

```tsx
const formState = useFormState(FormDef, { firstName: "", lastName: "" });
```

This will return an instance of `GroupControl` which has a `fields` property which contains `FormControl` instances.

The core library contains an `<input>` renderer for `FormControl` called `Finput` which uses html5's custom validation feature to show errors.

```tsx
return (
  <div>
    <Finput type="text" state={formState.fields.firstName} />
    <Finput type="text" state={formState.fields.lastName} />
  </div>
);
```

There is also a small library [(@react-typed-forms/mui)](packages/mui/index.tsx) which has some renderers for the [MUI](https://material-ui.com/) `TextField` component.

## Rendering

Creating renderers for a `FormControl` is very easy, it's a simple matter of using a hook function to register change listening.

The easiest way is to just use `useFormStateVersion()` to trigger a re-render whenever any change that needs to be re-rendered occurs.

The most low level change listener hook is `useChangeListener()` which just runs an arbitrary listener function for the given change types.

Let's take a look at the `FInput` implementation which uses both:

```tsx
// Only allow strings and numbers
export type FinputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  state: FormControl<string | number>;
};

export function Finput({ state, ...others }: FinputProps) {
  // Re-render on value or disabled state change
  useFormStateVersion(state, NodeChange.Value | NodeChange.Disabled);

  // We need the DOM element for setting validation errors
  const domRef = useRef<HTMLInputElement | null>(null);

  // Update the HTML5 custom validity whenever the error message is changed/cleared
  useChangeListener(
    state,
    () => domRef.current?.setCustomValidity(state.error ?? ""),
    NodeChange.Error
  );
  return (
    <input
      ref={(r) => {
        domRef.current = r;
        if (r) r.setCustomValidity(state.error ?? "");
      }}
      value={state.value}
      disabled={state.disabled}
      onChange={(e) => state.setValue(e.currentTarget.value)}
      onBlur={() => state.setTouched(true)}
      {...others}
    />
  );
}
```

## Other listener hooks

### `useAsyncValidator()`

If you need complex validation which requires calling a web service, call `useAsyncValidator()` with your validation callback which returns a `Promise` with the error message (or null/undefined for valid). You also pass in a debounce time in milliseconds, so that you don't validate on each keypress.

### `useFormListener()`

A common scenario for forms is that you'd like to have a Save button which is disabled when the form is invalid.

```tsx
const [formValid, setFormValid] = useState(formState.valid);
useChangeListener(formState, () => setFormValid(formState.valid), NodeChange.Valid);

... render form...
<button disabled={!formValid} onClick={() => save()}>Save</button>
```

`useFormListener()` handles the state updates for you so you could replace the above code with:

```ts
const formValid = useFormListener(formState, (c) => c.valid, NodeChange.Valid);
```

### `useFormListenerComponent()`

The only downside to `useFormListener()` is that you will be re-rendering the whole component, which usually won't matter if it's not too complicated but we can do better.

```tsx
const FormValid = useFormListenerComponent(formState, c => c.valid, NodeChange.Valid);
...render form...
<FormValid>{(formValid) => <button disabled={!formValid} onClick={() => save()}>Save</button>}</FormValid>
```

## API Docs

Typedoc API [docs](docs/README.md)
