import {
  addElement,
  Control,
  ControlChange,
  Finput,
  FormArray,
  getElems,
  getFields,
  renderAll,
  useControl,
  useControlStateComponent,
  useMappedControl,
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
  const StructureCount = useControlStateComponent(
    formState,
    (c, v?: number) => (v ?? -1) + 1,
    ControlChange.Structure
  );
  const mapped = useMappedControl(formState, (v) =>
    v.value.stringChildren.join(",")
  );
  const StringsJoined = useControlStateComponent(mapped, (c) => c.value);
  useValueChangeEffect(formState, (v) => console.log(v));
  const fields = getFields(formState);
  return (
    <div>
      <StructureCount>
        {(count) => <h2>{count} notifications</h2>}
      </StructureCount>
      <StringsJoined children={(s) => <div>{s}</div>} />
      <FormArray state={fields.stringChildren}>
        {(s) =>
          s.map((x) => (
            <div key={x.uniqueId}>
              <label>String</label> <Finput state={x} />
            </div>
          ))
        }
      </FormArray>
      <button
        onClick={() =>
          addElement(
            fields.stringChildren,
            "child " + (getElems(fields.stringChildren).length + 1)
          )
        }
      >
        Add string
      </button>
      <button onClick={() => fields.stringChildren.setValue(["Reset"])}>
        Reset strings
      </button>
      <TreeStructure state={fields.substructure} />
    </div>
  );
}

function TreeStructure({
  state,
}: {
  state: Control<SubStructure>;
}): ReactElement {
  const fields = getFields(state);
  return (
    <div>
      <div>
        <label>ID:</label>
        <Finput state={fields.id} />
      </div>
      <div style={{ paddingLeft: 10, margin: 10 }}>
        <FormArray
          state={fields.children}
          children={renderAll((x) => (
            <TreeStructure state={x} />
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
