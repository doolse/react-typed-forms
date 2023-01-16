import {
  buildSchema,
  ControlDefinition,
  ControlDefinitionType,
  createFormEditHooks,
  DataRenderType,
  defaultExpressionHook,
  FormRendererComponentsContext,
  GroupRenderType,
  renderControl,
  stringField,
  stringOptionsField,
} from "@react-typed-forms/schemas";
import { useControl } from "@react-typed-forms/core";
import { MuiFormRenderer } from "@react-typed-forms/schemas-mui";

interface NameForm {
  first: string;
  last: string;
  gender: string;
}

const hooks = createFormEditHooks(defaultExpressionHook);
export default function RenderAForm() {
  const form = useControl({});
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
          }),
          data: form,
        },
        hooks,
        ""
      )}
    </FormRendererComponentsContext.Provider>
  );
}
