import {
  addElement,
  Control,
  getElems,
  getFields,
} from "@react-typed-forms/core";

function typeWithNull<A extends { id: string } | null>(c: Control<A>) {
  // @ts-expect-error
  getFields(c).id;
  c.isNonNull() && getFields(c).id;
}

function typeWithUndefined<A extends { id: string } | undefined>(
  c: Control<A>,
  k: keyof A
) {
  // @ts-expect-error
  getFields(c).id;
  c.isNonNull() && getFields(c).id;
}

function nonArray(c: Control<string>) {
  // @ts-expect-error
  getFields(c).id;
  // @ts-expect-error
  addElement(c, "");
  // @ts-expect-error
  newElement(c, "", "");
}

function takesArray<A>(c: Control<A[] | undefined>) {
  // @ts-expect-error
  getElems(c)[0];
  c.isNonNull() && getElems(c)[0];
}

function anyControl(c: Control<any>) {
  getFields(c)[""];
  addElement(c, {});
  nonArray(c);
  addElement(getFields(c)?.["id"], "");
  typeWithNull(c);
  takesArray(c);
}
