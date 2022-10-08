import { Control } from "@react-typed-forms/core";

function typeWithNull<A extends { id: string } | null>(c: Control<A>) {
  // @ts-expect-error
  c.fields.id;
  c.fields?.id;
}

function typeWithUndefined<A extends { id: string } | undefined>(
  c: Control<A>
) {
  // @ts-expect-error
  c.fields.id;
  c.fields?.id;
}

function nonArray(c: Control<string | undefined | null>) {
  // @ts-expect-error
  c.fields.id;
  // @ts-expect-error
  c.add("");
  // @ts-expect-error
  c.newElement("", "");
}

function anyControl(c: Control<any>) {
  // @ts-expect-error
  c.fields[""];
  c.add({});
  nonArray(c);
}
