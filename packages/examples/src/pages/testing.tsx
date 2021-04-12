import {
  AllowedDef,
  buildGroup,
  formGroup,
  node,
  ValueNodeFields,
  ValueTypeForDefintion,
} from "@react-typed-forms/core";

interface FormData {
  shit: string;
  arse: string;
  fuck: {
    bam: number | undefined;
  };
}

type blah = {
  ho?: number | undefined;
};

type blablah = Required<blah>;

type FieldsType = ValueNodeFields<FormData>;

type AllowedDefs = AllowedDef<string[]>;

const Def = buildGroup<FormData>()({
  arse: "",
  shit: "",
  fuck: formGroup({ bam: undefined }),
});

type DefValue = ValueTypeForDefintion<typeof Def>;

export default function Doit() {
  return <div>Hello</div>;
}
