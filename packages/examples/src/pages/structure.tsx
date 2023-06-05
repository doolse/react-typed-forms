import {
  addElement,
  Control,
  Finput,
  FormArray,
  RenderControl,
  renderAll,
  RenderValue,
  useComputed,
  useControl,
  useValueChangeEffect,
} from "@react-typed-forms/core";
import React, { ReactElement } from "react";

interface SubStructure {
  id: string;
  children: SubStructure[];
}

interface StructureForm {
  stringChildren: string[];
  substructure: SubStructure;
}

export default function SimpleExample() {
  const formState = useControl<StructureForm>({
    stringChildren: [],
    substructure: { id: "root", children: [] },
  });

  const mapped = useComputed(() => formState.value.stringChildren.join(","));
  useValueChangeEffect(formState, (v) => console.log(v));
  const fields = formState.fields;
  return (
    <div>
      <RenderValue
        toValue={(v?: number) => (v ?? -1) + 1}
        children={(count) => <h2>{count} notifications</h2>}
      />
      <RenderControl children={() => <div>{mapped.value}</div>} />
      <FormArray control={fields.stringChildren}>
        {(s) =>
          s.map((x) => (
            <div key={x.uniqueId}>
              <label>String</label> <Finput control={x} />
            </div>
          ))
        }
      </FormArray>
      <button
        onClick={() =>
          addElement(
            fields.stringChildren,
            "child " + (fields.stringChildren.elements.length + 1)
          )
        }
      >
        Add string
      </button>
      <button onClick={() => (fields.stringChildren.value = ["Reset"])}>
        Reset strings
      </button>
      <TreeStructure control={fields.substructure} />
    </div>
  );
}

function TreeStructure({
  control,
}: {
  control: Control<SubStructure>;
}): ReactElement {
  const fields = control.fields;
  return (
    <div>
      <div>
        <label>ID:</label>
        <Finput control={fields.id} />
      </div>
      <div style={{ paddingLeft: 10, margin: 10 }}>
        <FormArray
          control={fields.children}
          children={renderAll((x) => (
            <TreeStructure control={x} />
          ))}
        />
      </div>
      <div>
        <button
          onClick={() => addElement(fields.children, { id: "", children: [] })}
        >
          Add Child
        </button>
      </div>
    </div>
  );
}
