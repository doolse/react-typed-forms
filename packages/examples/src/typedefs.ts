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
