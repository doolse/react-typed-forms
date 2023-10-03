"use client";
import {
  applyDefaultValues,
  buildSchema,
  compoundField,
  ControlDefinitionType,
  createFormEditHooks,
  dataControl,
  DataRenderType,
  DateTimeRenderOptions,
  defaultExpressionHook,
  fieldValueExpr,
  FormRendererProvider,
  GroupRenderType,
  renderControl,
  stringField,
  stringOptionsField,
  visibility,
} from "@react-typed-forms/schemas";
import { useControl } from "@react-typed-forms/core";
import { MuiFormRenderer } from "@react-typed-forms/schemas-mui";
import { FieldType, makeScalarField } from "@react-typed-forms/schemas/lib";

interface NameForm {
  first: string;
  middle: string;
  last: string;
  gender: string;
  date: string;
  compoundOptional: {
    nest: string;
  };
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
    { name: "Other", value: "O" }
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
  nameFormSchema
);

const hooks = createFormEditHooks(defaultExpressionHook);
export default function RenderAForm() {
  const form = useControl(withDefaults);
  return (
    <FormRendererProvider value={MuiFormRenderer}>
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
        ""
      )}
    </FormRendererProvider>
  );
}
