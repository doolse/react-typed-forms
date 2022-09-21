import {
  BaseControlMetadata,
  ControlChange,
  FormControl,
  ValueTypeForControl,
} from "./nodes";

interface Test<V> {
  // fields
  readonly fields: 0 extends 1 & V
    ? { [k: string]: Test<any> }
    : NonNullable<V> extends { [k: string | number]: any }
    ? { [K in keyof V]-?: Test<V[K]> }
    : never;
}

function needAnyControl(takeAny: Test<any>) {
  takeAny.fields![""];
  // takeAny.elems?.find((x) => true)?.value;
}

function anA<A extends { id: string }>(
  fc: FormControl<A>,
  anyControl: FormControl<any>,
  strControl: FormControl<string>,
  arrControl: FormControl<string[] | undefined>,
  structureArray: Test<{ id: string }[]>
) {
  fc.fields.id.value;
  anyControl.fields?.[""];
  anyControl.as<string[]>().elems[0];
  arrControl.elems![0].value;
  fc.elems.map((x) => x.value); // can this error error?
  // strControl.fields[""].value; // error
  // fc.fields.id2.value; // error
  // strControl.elems.map(); // error
  // strControl.as<string[]>().value; // error
  // strControl.fields["field"].value; // error
  // arrControl.fields[0].value; // error
  needAnyControl(structureArray);
}
