import { Control } from "@react-typed-forms/core";

function typeWithNull<A extends { id: string } | null>(c: Control<A>) {
  // @ts-expect-error
  c.fields.id;
  c.fields?.id;
}

function typeWithUndefined<A extends { id: string } | undefined>(
  c: Control<A>,
  k: keyof A
) {
  // @ts-expect-error
  c.fields.id;
  c.fields?.id;
  c.isNotNull() && c.fields.id;
}

function nonArray(c: Control<string>) {
  // @ts-expect-error
  c.fields.id;
  // @ts-expect-error
  c.add("");
  // @ts-expect-error
  c.newElement("", "");
}

function takesArray<A>(c: Control<A[] | undefined>) {
  // @ts-expect-error
  c.elems[0];
  c.elems?.[0];
  c.isNotNull() && c.elems[0];
}

function anyControl(c: Control<any>) {
  // @ts-expect-error
  c.fields[""];
  c.add({});
  nonArray(c);
  c.fields?.["id"].add("");
  typeWithNull(c);
  takesArray(c);
}

export function isChildOf<T extends { children?: T[] }>(
  node: Control<T>,
  child: Control<T>
): boolean {
  node.fields.children.elems!.forEach((x) => x.elems);
  return Boolean(
    node.fields.children.elems?.some((x) => x === child || isChildOf(x, child))
  );
}
