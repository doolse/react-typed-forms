import {
  addElement,
  Control,
  Finput,
  RenderControl,
  RenderElements,
  useComputed,
  useControl,
  useValueChangeEffect,
} from "@react-typed-forms/core";
import React, { ReactElement } from "react";
import { useRenderCount } from "../index";

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
  const count = useRenderCount();
  return (
    <div>
      <h2>{count} notifications</h2>
      <RenderControl children={() => <div>{mapped.value}</div>} />
      <RenderElements control={fields.stringChildren}>
        {(x) => (
          <div>
            <label>String</label> <Finput control={x} />
          </div>
        )}
      </RenderElements>
      <button
        onClick={() =>
          addElement(
            fields.stringChildren,
            "child " + (fields.stringChildren.elements.length + 1),
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
        <RenderElements
          control={fields.children}
          children={(x) => <TreeStructure control={x} />}
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
