import {
  defineElements,
  defineFields,
  FormArray,
  notEmpty,
  useControl,
  useOptionalFields,
  validated,
} from "@react-typed-forms/core";
import { FTextField } from "@react-typed-forms/mui";
import { Button } from "@material-ui/core";

type MyForm = {
  field1?: string;
  field2?: string;
  strings?: string[];
  subObject?: { coolBeans: string };
};

export default function CharliePage() {
  const fc = useControl<MyForm, { shit: string; element?: HTMLElement | null }>(
    {},
    defineFields({
      field1: validated(notEmpty("Please put it in")),
      strings: defineElements((c) =>
        c.withValidator(notEmpty("PLS")).withMetadata({ shit: "" })
      ),
    })
  );
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
