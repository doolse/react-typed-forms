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
```
<!-- AUTO-GENERATED-CONTENT:END -->

## Initialise a `Control`

A `Control` is essentially an advanced [signal](https://preactjs.com/guide/v10/signals/) with additional state for tracking form metadata, see [Control Properties](#control-properties) 
and the ability to treat object fields and array elements as child `Control`s.   

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

`useControl<V>(initialValue, configure)` is used to define a control which holds an immutable value of type V.

Because `formState` is a `Control` which holds a value of type `SimpleForm`, you can access a child `Control` by using the parent's `fields` property.

<!-- AUTO-GENERATED-CONTENT:START (CODE:src=./packages/examples/src/pages/simple.tsx&lines=23-26) -->
<!-- The below code snippet is automatically added from ./packages/examples/src/pages/simple.tsx -->
```tsx
      <label>First Name</label>
      <Finput id="firstName" type="text" control={fields.firstName} />
      <label>Last Name *</label>
      <Finput id="lastName" type="text" control={fields.lastName} />
```
<!-- AUTO-GENERATED-CONTENT:END -->

`Finput` is a simple wrapper component around the standard DOM `input` tag, which supports showing validation errors with HTML5 `setCustomValidity()`. 
The important thing to note here is that the parent component will not need to be re-rendered while typing, as would be needed with the standard `useState()` style form rendering.

Along with `Finput`, the core library provides `Fselect` and `Fcheckbox`. There is also a small library [(@react-typed-forms/mui)](packages/mui/src/index.tsx) which has renderers for various [MUI](https://material-ui.com/) components.

## Control properties

Every `Control` implements `ControlProperties`:

<!-- AUTO-GENERATED-CONTENT:START (CODE:src=./packages/core/src/types.ts&lines=25-34) -->
<!-- The below code snippet is automatically added from ./packages/core/src/types.ts -->
```ts
export interface ControlProperties<V> {
  value: V;
  initialValue: V;
  error?: string | null;
  readonly valid: boolean;
  readonly dirty: boolean;
  disabled: boolean;
  touched: boolean;
  readonly optional: Control<NonNullable<V>> | undefined;
}
```
<!-- AUTO-GENERATED-CONTENT:END -->

A control is `valid` if it has an empty error message AND all of it's children controls are `valid`.

A control is `dirty` if the `initialValue` is not equal to the `value`.

A control's `touched` flag generally gets set to true `onBlur()` and is generally used to prevent error messages from showing until the user has attempted to enter a value.

## Rendering with Controls

Custom rendering of a `Control` boils down to the `useControlValue()` hook primitive. It behaves like [computed() or effect()](https://preactjs.com/guide/v10/signals/#computedfn), but
instead of re-renders the current component whenever any referenced `Control` property changes.
For example let's say you didn't want users to be able to click the save button unless they'd changed the data in the form and the form was valid, you could do this: 

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

There is another component specifically for rendering standard form like controls, 
which gives you some properties which you can usually directly add to DOM elements:

```tsx
export interface FormControlProps<V, E extends HTMLElement> {
    value: V;
    onChange: (e: ChangeEvent<E & { value: any }>) => void;
    onBlur: () => void;
    disabled: boolean;
    errorText?: string | null;
    ref: (elem: HTMLElement | null) => void;
}
```

The `Finput` component simply passes the properties through to the `<input>` tag.

<!-- AUTO-GENERATED-CONTENT:START (CODE:src=./packages/core/src/html/Finput.tsx&lines=6-36) -->
<!-- The below code snippet is automatically added from ./packages/core/src/html/Finput.tsx -->
```tsx
// Only allow strings and numbers
export type FinputProps<V extends string | number> =
  React.InputHTMLAttributes<HTMLInputElement> & {
    control: Control<V>;
  };

export function Finput<V extends string | number>({
  control,
  ...props
}: FinputProps<V>) {
  // Update the HTML5 custom validity whenever the error message is changed/cleared
  useControlEffect(
    () => control.error,
    (s) => (control.element as HTMLInputElement)?.setCustomValidity(s ?? "")
  );
  return (
    <RenderForm
      control={control}
      children={({ errorText, value, ...inputProps }) => (
        <input
          {...inputProps}
          value={value == null ? "" : value}
          ref={(r) => {
            control.element = r;
            if (r) r.setCustomValidity(control.current.error ?? "");
          }}
          {...props}
        />
      )}
    />
  );
```
<!-- AUTO-GENERATED-CONTENT:END -->


## Control Effects

You can run effects directly from changes to a `Control` by using the `useControlEffect()` hook.

```ts 
function useControlEffect<V>(
  compute: () => V,
  onChange: (value: V) => void,
  initial?: ((value: V) => void) | boolean
): void;
```

The `compute` parameter calculates a value, if the value ever changes (equality is a shallow equals), the `onChange` effect is called.
The `initial` callback will be called first time if it is passed in, or if true is passed in it will simply call the `onChange` handler first time.

## Validation

Synchronous validation can be added to a control upon initialisation via the `configure` parameter of `useControl()`.

```ts 
const mustBeHigherThan4 = useControl(0, {validator: (v: number) => v > 4 ? undefined : "Please enter a number greather than 4" })
```

## Arrays

A `Control` containing an array can split each element out as it's own `Control` by using the 
`renderElements` helper function.

<!-- AUTO-GENERATED-CONTENT:START (CODE:src=./packages/examples/src/docs/arrays.tsx&lines=12-25) -->
<!-- The below code snippet is automatically added from ./packages/examples/src/docs/arrays.tsx -->
```tsx
export function ListOfTextFields() {
  const textFields = useControl<string[]>([]);

  return (
    <div>
      <RenderControl
        render={renderElements(textFields, (x) => (
          <Finput key={x.uniqueId} control={x} />
        ))}
      />
      <button onClick={() => addElement(textFields, "")}>Add</button>
    </div>
  );
}
```
<!-- AUTO-GENERATED-CONTENT:END -->

You can simple set the array value directly on the parent, or you can use the following 
functions to manipulate the elements.

```tsx
function addElement<V>(control: Control<V[] | undefined | null>, child: V,
           index?: number | Control<V> | undefined, insertAfter?: boolean): Control<V>
function removeElement<V>(control: Control<V[] | undefined>, child: number | Control<V>): void 
```
## Other hooks

### `useAsyncValidator()`

If you need complex validation which requires calling a web service, call `useAsyncValidator()` with your validation callback which returns a `Promise` with the error message (or null/undefined for valid). You also pass in a debounce time in milliseconds, so that you don't validate on each keypress.

TODO
