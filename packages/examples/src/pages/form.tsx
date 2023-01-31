import {
  buildSchema,
  ControlDefinition,
  ControlDefinitionType,
  createFormEditHooks,
  DataRenderType, DateTimeRenderOptions,
  defaultExpressionHook,
  FormRendererComponentsContext,
  GroupRenderType,
  renderControl,
  stringField,
  stringOptionsField,
} from "@react-typed-forms/schemas";
import { useControl } from "@react-typed-forms/core";
import { MuiFormRenderer } from "@react-typed-forms/schemas-mui";
import {FieldType, makeScalarField} from "@react-typed-forms/schemas/lib";

interface NameForm {
  first: string;
  last: string;
  gender: string;
  date: string;
}

const hooks = createFormEditHooks(defaultExpressionHook);
export default function RenderAForm() {
  const form = useControl({date: "0001-01-01T11:43:21.861+09:40"});
  return (
    <FormRendererComponentsContext.Provider value={MuiFormRenderer}>
      {renderControl(
        {
          type: ControlDefinitionType.Group,
          groupOptions: { type: GroupRenderType.Standard, hideTitle: true },
          children: [
            {
              renderOptions: { type: DataRenderType.Standard },
              required: true,
              title: undefined,
              type: ControlDefinitionType.Data,
              field: "first",
            },
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
              renderOptions: { type: DataRenderType.DateTime, format: "dd/MM/yyyy"} as DateTimeRenderOptions,
              readonly: true,
              title: "Date",
              type: ControlDefinitionType.Data,
              field: "date",
            },
          ],
        },
        {
          fields: buildSchema<NameForm>({
            first: stringField("First Name"),
            last: stringField("Last Name"),
            gender: stringOptionsField(
              "Gender",
              { value: "M", name: "Male" },
              { value: "F", name: "Female" },
              { name: "Other", value: "O" }
            ),
            date:makeScalarField({type: FieldType.DateTime})
          }),
          data: form,
        },
        hooks,
        ""
      )}
    </FormRendererComponentsContext.Provider>
  );
}
