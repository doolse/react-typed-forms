"use client";
import {
  applyDefaultValues,
  buildSchema,
  compoundField,
  ControlDefinitionType,
  createDefaultRenderers,
  createFormEditHooks,
  createFormRenderer,
  dataControl,
  DataRenderType,
  DateTimeRenderOptions,
  FieldType,
  fieldEqExpr,
  GroupRenderType,
  makeScalarField,
  renderControl,
  stringField,
  stringOptionsField,
  visibility,
} from "@react-typed-forms/schemas";
import {
  Control,
  Finput,
  RenderControl,
  useControl,
} from "@react-typed-forms/core";
import {
  muiActionRenderer,
  muiDateRenderer,
  muiTextfieldRenderer,
} from "@react-typed-forms/schemas-mui";
import { defaultFormEditHooks } from "@react-typed-forms/schemas/lib";

interface NameForm {
  first: string;
  middle: string;
  last: string;
  gender: string;
  date: string;
  compoundOptional: {
    nest: string;
  }[];
  compound: {
    nest: string;
  };
  compoundCollection: {
    nest: string;
  }[];
}

const nestSchema = buildSchema<{ nest: string }>({
  nest: stringField("Nested"),
});

const nameFormSchema = buildSchema<NameForm>({
  first: stringField("First Name"),
  middle: stringField("Middle Name"),
  last: stringField("Last Name"),
  gender: stringOptionsField(
    "Gender",
    { value: "M", name: "Male" },
    { value: "F", name: "Female" },
    { name: "Other", value: "O" },
  ),
  date: makeScalarField({ type: FieldType.Date }),
  compound: compoundField("Compound", nestSchema, {}),
  compoundOptional: compoundField("Compound Optional", nestSchema, {
    required: false,
    collection: true,
  }),
  compoundCollection: compoundField("Compound Collection", nestSchema, {
    collection: true,
  }),
});

const withDefaults = applyDefaultValues({ date: "2024-10-12" }, nameFormSchema);

const hooks = defaultFormEditHooks;

const renderer = createFormRenderer(
  [muiTextfieldRenderer("outlined"), muiActionRenderer(), muiDateRenderer()],
  createDefaultRenderers({
    label: {
      className: "flex flex-col",
      requiredElement: <span className="text-red-500"> *</span>,
    },
    array: {
      removableClass: "grid grid-cols-[1fr_auto] items-center gap-x-2",
      childClass: "grow",
    },
    group: {
      gridClassName: "gap-x-2 gap-y-4",
    },
    action: {
      className: "bg-primary rounded-lg p-4 text-white",
    },
  }),
);

export default function RenderAForm() {
  const form = useControl<NameForm>(withDefaults);

  return (
    <div className="container">
      <h1>Simple Schema Test</h1>
      {renderControl(
        {
          type: ControlDefinitionType.Group,
          groupOptions: { type: GroupRenderType.Grid, hideTitle: true },
          children: [
            {
              required: true,
              title: undefined,
              type: ControlDefinitionType.Data,
              field: "first",
            },
            dataControl("middle", undefined, {
              dynamic: [visibility(fieldEqExpr("first", "Jolse"))],
            }),
            {
              renderOptions: { type: DataRenderType.Standard },
              required: true,
              title: undefined,
              type: ControlDefinitionType.Data,
              field: "last",
            },
            {
              renderOptions: { type: DataRenderType.Standard },
              required: true,
              title: undefined,
              type: ControlDefinitionType.Data,
              field: "gender",
            },
            {
              renderOptions: {
                type: DataRenderType.DateTime,
                format: "dd/MM/yyyy",
              } as DateTimeRenderOptions,
              readonly: true,
              title: "Date",
              type: ControlDefinitionType.Data,
              field: "date",
            },
            {
              title: "Required compound",
              type: ControlDefinitionType.Group,
              compoundField: "compound",
              groupOptions: {
                type: GroupRenderType.Standard,
                hideTitle: true,
              },
              children: [
                {
                  renderOptions: { type: DataRenderType.Standard },
                  required: true,
                  title: undefined,
                  type: ControlDefinitionType.Data,
                  field: "nest",
                },
              ],
            },
            {
              title: "Optional compound",
              type: ControlDefinitionType.Group,
              compoundField: "compoundOptional",
              groupOptions: {
                type: GroupRenderType.Standard,
                hideTitle: false,
              },
              children: [
                {
                  renderOptions: { type: DataRenderType.Standard },
                  required: true,
                  title: undefined,
                  type: ControlDefinitionType.Data,
                  field: "nest",
                },
              ],
            },
            {
              title: "Compound collection",
              type: ControlDefinitionType.Group,
              compoundField: "compoundCollection",
              groupOptions: {
                type: GroupRenderType.Standard,
                hideTitle: false,
              },
              children: [
                {
                  renderOptions: { type: DataRenderType.Standard },
                  required: true,
                  title: undefined,
                  type: ControlDefinitionType.Data,
                  field: "nest",
                },
              ],
            },
          ],
        },
        form,
        {
          fields: nameFormSchema,
          renderer,
          hooks,
        },
      )}
      <button onClick={() => (form.fields.compoundOptional.value = [])}>
        Enable optional part
      </button>
      <RenderControl
        render={() => <pre>{JSON.stringify(form.value, null, 2)}</pre>}
      />
    </div>
  );
}
