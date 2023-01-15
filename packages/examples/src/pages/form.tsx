import {
  ControlDefinitionType,
  createFormEditHooks,
  DataRenderType,
  defaultExpressionHook,
  FormRendererComponentsContext,
  renderControl,
  stringField,
} from "@react-typed-forms/schemas";
import { useControl } from "@react-typed-forms/core";
import { MuiFormRenderer } from "@react-typed-forms/schemas-mui";

const hooks = createFormEditHooks(defaultExpressionHook);
export default function RenderAForm() {
  const form = useControl({});
  return (
    <FormRendererComponentsContext.Provider value={MuiFormRenderer}>
      {renderControl(
        {
          adornments: undefined,
          children: [],
          compoundField: undefined,
          defaultValue: undefined,
          displayData: undefined,
          dynamic: [],
          groupOptions: undefined,
          noEdit: false,
          renderOptions: { type: DataRenderType.Standard },
          required: false,
          title: undefined,
          type: ControlDefinitionType.Data,
          field: "first",
        },
        { fields: [stringField("First Name")("first")], data: form },
        hooks,
        ""
      )}
    </FormRendererComponentsContext.Provider>
  );
}
