
# React typed forms schemas

A simple abstraction on top of `@react-typed-forms/core` for defining JSON compatible schemas and 
rendering UIs for users to enter that data. 

## Install

```npm
npm install @react-typed-forms/schemas
```

## Example

<!-- AUTO-GENERATED-CONTENT:START (CODE:src=../examples/src/docs/schemas-example.tsx) -->
<!-- The below code snippet is automatically added from ../examples/src/docs/schemas-example.tsx -->
```tsx
import { useControl } from "@react-typed-forms/core";
import React from "react";
import {
  buildSchema,
  createDefaultRenderers,
  createFormRenderer,
  defaultFormEditHooks,
  defaultTailwindTheme,
  defaultValueForFields,
  FormRenderer,
  intField,
  renderControl,
  stringField,
  useControlDefinitionForSchema,
} from "@react-typed-forms/schemas";

/** Define your form */
interface SimpleForm {
  firstName: string;
  lastName: string;
  yearOfBirth: number;
}

/* Build your schema fields. Importantly giving them Display Names for showing in a UI */
const simpleSchema = buildSchema<SimpleForm>({
  firstName: stringField("First Name"),
  lastName: stringField("Last Name", { required: true }),
  yearOfBirth: intField("Year of birth", { defaultValue: 1980 }),
});

/* Create a form renderer based on a simple tailwind css based theme */
const renderer: FormRenderer = createFormRenderer(
  [],
  createDefaultRenderers(defaultTailwindTheme),
);

export default function SimpleSchemasExample() {
  /* Create a `Control` for collecting the data, the schema fields can be used to get a default value */
  const data = useControl<SimpleForm>(() =>
    defaultValueForFields(simpleSchema),
  );

  /* Generate a ControlDefinition automatically from the schema */
  const controlDefinition = useControlDefinitionForSchema(simpleSchema);

  return (
    <div className="container my-4 max-w-2xl">
      {/* Render the ControlDefinition using `data` for the form state */}
      {renderControl(controlDefinition, data, {
        fields: simpleSchema,
        renderer,
        hooks: defaultFormEditHooks,
      })}
      <pre>{JSON.stringify(data.value, null, 2)}</pre>
    </div>
  );
}
```
<!-- AUTO-GENERATED-CONTENT:END -->

This will produce this UI:

<img src="../../images/schemas.png">

## Schema Fields and Control Definitions

### `SchemaField`

A `SchemaField` is a JSON object which describes the definition of a field inside the context of a JSON object. Each `SchemaField` must have a field name and a `FieldType` which will map to JSON. The following built in types are defined with these JSON mappings:

* `String` - A JSON string
* `Bool` - A JSON boolean
* `Int` - A JSON number
* `Double` - A JSON number
* `Date` - A date stored as 'yyyy-MM-dd' in a JSON string
* `DateTime` - A date and time stored in ISO8601 format in a JSON string
* `Compound` - A JSON object with a list of `SchemaField` children

Each `SchemaField` can also be marked as a `collection` which means that it will be mapped to a JSON array of the defined `FieldType`.

### Defining fields

While you can define a `SchemaField` as plain JSON, e.g. 
```json
[
  {
    "type": "String",
    "field": "firstName",
    "displayName": "First Name"
  },
  {
    "type": "String",
    "field": "lastName",
    "displayName": "Last Name",
    "required": true
  },
  {
    "type": "Int",
    "field": "yearOfBirth",
    "displayName": "Year of birth",
    "defaultValue": 1980
  }
]
```

However if you have existing types which you would like to define `SchemaField`s for the library contains a function called `buildSchema` a type safe way of generating fields for a type:

```tsx
interface SimpleForm {
  firstName: string;
  lastName: string;
  yearOfBirth: number;
}

const simpleSchema = buildSchema<SimpleForm>({
  firstName: stringField("First Name"),
  lastName: stringField("Last Name", { required: true }),
  yearOfBirth: intField("Year of birth", { defaultValue: 1980 }),
});
```

### Field options

Often a field only has a set of allowed values, e.g. a enum. `SchemaField` allows this to be modeled by 
providing an array of `FieldOption`: 

<!-- AUTO-GENERATED-CONTENT:START (CODE:src=./src/types.ts&lines=37-41) -->
<!-- The below code snippet is automatically added from ./src/types.ts -->
```ts
export interface FieldOption {
  name: string;
  value: any;
}
```
<!-- AUTO-GENERATED-CONTENT:END -->

For example you could only allow certain last names:

```ts
stringField('Last Name', { 
    required: true,
    options:[ 
        { name: "Smith", value: "smith" }, 
        { name: "Jones", value: "jones" }
    ]
});
```

<img src="../../images/schemas-option.png">

### `ControlDefinition`

A `ControlDefinition` is a JSON object which describes what should be rendered in a UI. Each `ControlDefinition` can be one of 4 distinct types:

* `DataControlDefinition` - Points to a `SchemaField` in order to render a control for editing of data.
* `GroupedControlsDefinition` - Contains an optional title and a list of `ControlDefinition` children which should be rendered as a group. Optionally can refer to a `SchemaField` with type `Compound` in order to capture nested data.
* `DisplayControlDefinition` - Render readonly content, current text and HTML variants are defined.
* `ActionControlDefinition` - Renders an action button, useful for hooking forms up with outside functionality.

If you don't care about the layout of the form that much you can generate the definition automatically by using `useControlDefinitionForSchema()`.

TODO renderOptions, DataRenderType for choosing render style.

## Form Renderer

The actual rendering of the UI is abstracted into an object which contains functions for rendering the various `ControlDefinition`s and various parts of the UI:

<!-- AUTO-GENERATED-CONTENT:START (CODE:src=./src/controlRender.tsx&lines=128-138) -->
<!-- The below code snippet is automatically added from ./src/controlRender.tsx -->
```tsx
export interface FormRenderer {
  renderData: (props: DataRendererProps) => ReactElement;
  renderGroup: (props: GroupRendererProps) => ReactElement;
  renderDisplay: (props: DisplayRendererProps) => ReactElement;
  renderAction: (props: ActionRendererProps) => ReactElement;
  renderArray: (props: ArrayRendererProps) => ReactElement;
  renderLabel: (props: LabelRendererProps, elem: ReactElement) => ReactElement;
  renderVisibility: (visible: Visibility, elem: ReactElement) => ReactElement;
  renderAdornment: (props: AdornmentProps) => AdornmentRenderer;
}
```
<!-- AUTO-GENERATED-CONTENT:END -->

The `createFormRenderer` function takes an array of `RendererRegistration` which allows for customising the rendering.

<!-- AUTO-GENERATED-CONTENT:START (CODE:src=./src/renderers.tsx&lines=109-118) -->
<!-- The below code snippet is automatically added from ./src/renderers.tsx -->
```tsx
export type RendererRegistration =
  | DataRendererRegistration
  | GroupRendererRegistration
  | DisplayRendererRegistration
  | ActionRendererRegistration
  | LabelRendererRegistration
  | ArrayRendererRegistration
  | AdornmentRendererRegistration
  | VisibilityRendererRegistration;
```
<!-- AUTO-GENERATED-CONTENT:END -->

Probably the most common customisation would be to add a `DataRendererRegistration` which will change the way a `DataControlDefinition` is rendered for a particular FieldType:

<!-- AUTO-GENERATED-CONTENT:START (CODE:src=./src/renderers.tsx&lines=48-61) -->
<!-- The below code snippet is automatically added from ./src/renderers.tsx -->
```tsx
export interface DataRendererRegistration {
  type: "data";
  schemaType?: string | string[];
  renderType?: string | string[];
  options?: boolean;
  collection?: boolean;
  match?: (props: DataRendererProps) => boolean;
  render: (
    props: DataRendererProps,
    defaultLabel: (label?: Partial<LabelRendererProps>) => LabelRendererProps,
    renderers: FormRenderer,
  ) => ReactElement;
}
```
<!-- AUTO-GENERATED-CONTENT:END -->
* The `schemaType` field specifies which `FieldType`(s) should use this `DataRendererRegistration`, unspecified means allow any.
* The `renderType` field specifies which `DataRenderType` this registration applies to.
* The `match` function can be used if the matching logic is more complicated than provided by the other.
* The `render` function does the actual rendering if the ControlDefinition/SchemaField matches the registration.

A good example of a custom DataRendererRegistration is the `muiTextField` which renders `String` fields using the `FTextField` wrapper of the `@react-typed-forms/mui` library:

<!-- AUTO-GENERATED-CONTENT:START (CODE:src=../schemas-mui/src/index.tsx&lines=12-35) -->
<!-- The below code snippet is automatically added from ../schemas-mui/src/index.tsx -->
```tsx
export function muiTextfieldRenderer(
  variant?: "standard" | "outlined" | "filled",
): DataRendererRegistration {
  return {
    type: "data",
    schemaType: FieldType.String,
    renderType: DataRenderType.Standard,
    render: (r, makeLabel, { renderVisibility }) => {
      const { title, required } = makeLabel();
      return renderVisibility(
        r.visible,
        <FTextField
          variant={variant}
          required={required}
          fullWidth
          size="small"
          state={r.control}
          label={title}
        />,
      );
    },
  };
}
```
<!-- AUTO-GENERATED-CONTENT:END -->

Changing the simple example above to use the following:

```tsx
const renderer: FormRenderer = createFormRenderer(
    [muiTextFieldRenderer()], 
    createDefaultRenderer (defaultTailwindTheme));
```

This will produce this UI:

<img src="../../images/schemas-muifield.png">

## TODO

* Label rendering
* Visibility
* Arrays
* Display controls

