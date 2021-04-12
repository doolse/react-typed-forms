import {
  control,
  formGroup,
  ValueNodeFields,
  ValueTypeForDefintion,
} from "@react-typed-forms/core";

interface FormData {
  shit: string;
  arse: string;
}

type FieldsType = ValueNodeFields<FormData>;

const Def = formGroup({
  blah: control<string>(),
});

type DefValue = ValueTypeForDefintion<typeof Def>;

export default function Doit() {
  return <div>Hello</div>;
}
