"use client";
import React, { ReactNode } from "react";
import {
  addElement,
  NotDefinedContext,
  RenderElements,
  useControl,
} from "@react-typed-forms/core";

export default function DebugComponent() {
  const control = useControl<{ one: string; two: string }[]>();
  return (
    <NotDefinedContext.Provider value={"Loading"}>
      <RenderElements
        control={control}
        container={(children, c) => (
          <>
            <div>Header</div>
            {children}
            {`${c.length} elements`}
          </>
        )}
        empty={"This empty"}
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
    </NotDefinedContext.Provider>
  );
}
