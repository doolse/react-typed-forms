"use client";
import React, { ReactNode } from "react";
import {
  addElement,
  RenderElements,
  useControl,
} from "@react-typed-forms/core";

export default function DebugComponent() {
  const control = useControl<{ one: string; two: string }[]>([]);
  return (
    <>
      <RenderElements
        control={control}
        header={() => <div>Header</div>}
        empty={"This empty"}
        notDefined={"This not defined"}
        footer={(i) => `${i.length} elements`}
      >
        {(x) => x.fields.one.value + " - " + x.fields.two.value}
      </RenderElements>
      <button
        onClick={() =>
          addElement(control, {
            one: (control.elements?.length ?? 1).toString(),
            two: "TWO",
          })
        }
      >
        Add
      </button>
    </>
  );
}
