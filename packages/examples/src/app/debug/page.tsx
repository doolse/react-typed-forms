"use client";
import React from "react";
import {
  Control,
  controlValues,
  useComputed,
  useControl,
  useControlEffect,
} from "@react-typed-forms/core";

interface SomeFields {
  one: string;
  two: string;
  three: string;
}
export default function DebugComponent() {
  const control = useControl<SomeFields>({
    one: "one",
    two: "two",
    three: "three",
  });
  const disabledCount = useComputed(() =>
    Object.keys(control.value).reduce(
      (c, k) => c + (control.fields[k as keyof SomeFields].disabled ? 1 : 0),
      0
    )
  );
  useControlEffect(
    () => disabledCount.value,
    (c) => console.log({ c })
  );
  useControlEffect(controlValues({ disabledCount }), (c) => console.log({ c }));
  const v = disabledCount.value;
  return (
    <>
      {v}
      <Two control={control.fields.one} />
      <Two control={control.fields.two} />
    </>
  );
}

function Two({ control }: { control: Control<string> }) {
  useControl(control.value, { afterCreate: () => (control.disabled = true) });
  return (
    <button onClick={() => (control.disabled = !control.disabled)}>
      One ({control.disabled ? "disabled" : "not disabled"})
    </button>
  );
}
