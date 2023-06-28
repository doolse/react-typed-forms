import {
  addElement,
  Finput,
  RenderElements,
  useControl,
} from "@react-typed-forms/core";
import React from "react";

export function ListOfTextFields() {
  const textFields = useControl<string[]>([]);

  return (
    <div>
      <RenderElements
        control={textFields}
        children={(x) => <Finput control={x} />}
      />
      <button onClick={() => addElement(textFields, "")}>Add</button>
    </div>
  );
}
