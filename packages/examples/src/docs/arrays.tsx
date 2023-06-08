import {
  addElement,
  Control,
  Finput,
  FormArray,
  RenderControl,
  renderElements,
  useControl,
} from "@react-typed-forms/core";
import React from "react";

export function ListOfTextFields() {
  const textFields = useControl<string[]>([]);

  return (
    <div>
      <RenderControl
        render={renderElements(textFields, (x) => (
          <Finput key={x.uniqueId} control={x} />
        ))}
      />
      <button onClick={() => addElement(textFields, "")}>Add</button>
    </div>
  );
}
