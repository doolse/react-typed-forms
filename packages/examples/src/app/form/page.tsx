"use client";
import {
  applyDefaultValues,
  buildSchema,
  compoundField,
  ControlDefinitionType,
  createDefaultActionRenderer,
  createDefaultArrayRenderer,
  createDefaultLabelRenderer,
  createFormEditHooks,
  createRenderer,
  dataControl,
  DataRenderType,
  DateTimeRenderOptions,
  defaultExpressionHook,
  FieldType,
  fieldValueExpr,
  FormRendererProvider,
  GroupRenderType,
  makeScalarField,
  renderControl,
  stringField,
  stringOptionsField,
  visibility,
} from "@react-typed-forms/schemas";
import { Finput, RenderControl, useControl } from "@react-typed-forms/core";

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
  date: makeScalarField({ type: FieldType.DateTime }),
  compound: compoundField("Compound", nestSchema, {}),
  compoundOptional: compoundField("Compound Optional", nestSchema, {
    required: false,
    collection: true,
  }),
  compoundCollection: compoundField("Compound Collection", nestSchema, {
    collection: true,
  }),
});

const withDefaults = applyDefaultValues(
  { date: "0001-01-01T11:43:21.861+09:40" },
  nameFormSchema,
);

const hooks = createFormEditHooks(defaultExpressionHook);

const renderer = createRenderer(
  {
    type: "data",
    render: ({ control }, withLabel) => withLabel(<Finput control={control} />),
  },
  createDefaultLabelRenderer({
    className: "flex flex-col my-2",
    required: <span className="text-red-500"> *</span>,
  }),
  createDefaultActionRenderer("bg-primary rounded-lg p-4 text-white"),
  createDefaultArrayRenderer({
    removableClass: "grid grid-cols-[1fr_auto] items-center gap-x-2",
    childClass: "grow",
  }),
);
export default function RenderAForm() {
  const form = useControl<NameForm>(withDefaults);

  return (
    <div className="container">
      <FormRendererProvider value={renderer}>
        {renderControl(
          {
            type: ControlDefinitionType.Group,
            groupOptions: { type: GroupRenderType.Standard, hideTitle: true },
            children: [
              {
                required: true,
                title: undefined,
                type: ControlDefinitionType.Data,
                field: "first",
              },
              dataControl("middle", {
                dynamic: [visibility(fieldValueExpr("first", "Jolse"))],
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
          {
            fields: nameFormSchema,
            data: form,
          },
          hooks,
          "",
        )}
        <button onClick={() => (form.fields.compoundOptional.value = [])}>
          Enable optional part
        </button>
        <RenderControl
          render={() => <pre>{JSON.stringify(form.value, null, 2)}</pre>}
        />
      </FormRendererProvider>
    </div>
  );
}
