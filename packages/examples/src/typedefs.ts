import {
  addElement,
  Control,
  controlValues,
  useControlEffect,
} from "@react-typed-forms/core";

function typeWithNull<A extends { id: string } | null>(c: Control<A>) {
  // @ts-expect-error
  c.fields.id;
  // @ts-expect-error
  c.optional.fields.id;
  c.optional?.fields.id;
}

function typeWithUndefined<A extends { id: string } | undefined>(
  c: Control<A>,
  k: keyof A
) {
  // @ts-expect-error
  c.fields.id;
  // @ts-expect-error
  c.optional.fields.id;
  c.optional?.fields.id;
  // @ts-expect-error
  c.elements?.map((x) => x.id);
}

function nonArray(c: Control<string>) {
  // @ts-expect-error
  c.fields.id;
  // @ts-expect-error
  addElement(c, "");
  // @ts-expect-error
  newElement(c, "", "");
  // @ts-expect-error
  c.elements.map((x) => x.toString());
}

function takesArray<A extends { id: string } | undefined>(
  c: Control<A[] | undefined>
) {
  // @ts-expect-error
  c.elements[0];
  c.optional && c.optional.elements[0];
  c.elements?.[0];
  c.optional?.elements.map((x) => x.optional?.fields.id);
}

function takesArrayO<A extends { id: string }>(c: Control<A[] | undefined>) {
  // @ts-expect-error
  c.elements[0];
  c.optional && c.optional.elements[0];
  c.elements?.[0];
  c.elements?.map((x) => x.fields.id);
}

function takesArrayNO<A extends { id: string }>(c: Control<A[]>) {
  c.optional && c.optional.elements[0];
  c.elements?.[0];
  c.elements.map((x) => x.fields.id);
}

function anyControl(c: Control<any>) {
  c.fields[""];
  addElement(c, {});
  nonArray(c);
  addElement(c.fields?.["id"], "");
  typeWithNull(c);
  takesArray(c);
}

function someControls(
  a: Control<{ something: string }>,
  b: Control<string | undefined>,
  c: Control<number>,
  d: Control<string>
) {
  useControlEffect(controlValues({ c, d }), (a) => {});
  useControlEffect(controlValues(a, b, c, d), (v) => {
    const va: { something: string } = v[0];
    const vb: string | undefined = v[1];
    const vc: number = v[2];
    const vd: string = v[3];
  });
}
