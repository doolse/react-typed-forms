import {
  ControlChange,
  defineControl,
  elementsWith,
  FormArray,
  useControl,
  useControlState,
  useOptionalFields,
  validateWith,
} from "@react-typed-forms/core";
import { FTextField } from "@react-typed-forms/mui";
import { Button } from "@material-ui/core";

type MyForm = {
  field1?: string;
  field2?: string;
  strings?: string[];
  subObject?: { coolBeans: string };
};
const FormDef = defineControl<MyForm>({
  field1: validateWith((v) => (!v ? "Please put it in" : undefined)),
  strings: elementsWith(
    validateWith((v) => (!v ? "Please put it in pls" : undefined))
  ),
});

export default function CharliePage() {
  const fc = useControl<MyForm>({});
  const fields = fc.fields;
  const subFields = useOptionalFields(fields.subObject);
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <FTextField state={fields.field1} label="Fair call" />
      <FTextField state={fields.field2} label="Two" />
      <FormArray state={fields.strings}>
        {(elems) => elems.map((v) => <FTextField state={v} label="Strings" />)}
      </FormArray>
      <Button onClick={() => fields.strings.add("")}>Add string</Button>
      {subFields && <FTextField state={subFields.coolBeans} label={"Beans"} />}
      <Button onClick={() => fields.subObject.setValue(undefined)}>
        Clear sub
      </Button>
      <Button onClick={() => fields.subObject.setValue({ coolBeans: "" })}>
        Re sub
      </Button>
      <Button
        onClick={() => {
          fc.validate();
          fc.setTouched(true);
          alert(JSON.stringify(fc.value, undefined, 2));
        }}
      >
        Show me JSON
      </Button>
    </div>
  );
}
