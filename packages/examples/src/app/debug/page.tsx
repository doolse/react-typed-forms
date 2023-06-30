"use client";
import React from "react";
import {
  addElement,
  Finput,
  NotDefinedContext,
  RenderElements,
  useControl,
} from "@react-typed-forms/core";
import { Child } from "./Child";

export default function DebugComponent() {
  const control = useControl<{ one: string; two: string }[]>();
  const child = useControl("child");
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
      <Child control={child} />
      <h1>{child.value}</h1>
    </NotDefinedContext.Provider>
  );
}
