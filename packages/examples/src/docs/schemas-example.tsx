import { useControl } from "@react-typed-forms/core";
import React from "react";
import {
  buildSchema,
  createDefaultRenderers,
  createFormRenderer,
  defaultTailwindTheme,
  defaultValueForFields,
  FormRenderer,
  intField,
  stringField,
  useControlDefinitionForSchema,
  useControlRenderer,
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
  const RenderForm = useControlRenderer(
    controlDefinition,
    simpleSchema,
    renderer,
  );

  return (
    <div className="container my-4 max-w-2xl">
      {/* Render the ControlDefinition using `data` for the form state */}
      <RenderForm control={data} />
      <pre>{JSON.stringify(data.value, null, 2)}</pre>
    </div>
  );
}
