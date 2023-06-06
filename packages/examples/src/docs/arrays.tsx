import {
  addElement,
  Control,
  Finput,
  FormArray,
  useControl,
} from "@react-typed-forms/core";
import React from "react";

export function ListOfTextFields() {
  const textFields = useControl<string[]>([]);

  return (
    <div>
      <FormArray control={textFields}>
        {(controls: Control<string>[]) =>
          controls.map((x) => <Finput key={x.uniqueId} control={x} />)
        }
      </FormArray>
      <button onClick={() => addElement(textFields, "")}>Add</button>
    </div>
  );
}
