import {
  ControlChange,
  Finput,
  getFields,
  useControl,
  useControlStateComponent,
  useMappedControls,
} from "@react-typed-forms/core";

export default function ChangesPage() {
  const form = useControl({ child1: 0, child2: 0 });
  const { child1, child2 } = getFields(form);
  const ChangeMapped = useControlStateComponent(
    useMappedControls({ child1, child2 }),
    (c, p?: number) => (p ?? -1) + 1,
    ControlChange.Value
  );
  const ChangeMapped2 = useControlStateComponent(
    useMappedControls(
      { child1, child2 },
      (c) => Number(c.child1) + Number(c.child2)
    ),
    (c) => c.value,
    ControlChange.Value
  );
  const ChangeCount = useControlStateComponent(
    form,
    (c, p?: number) => (p ?? -1) + 1,
    ControlChange.Value
  );
  return (
    <div>
      <ChangeCount
        children={(x) => (
          <div>
            Changes <span id="changeCount">{x}</span>
          </div>
        )}
      />
      <ChangeMapped
        children={(x) => (
          <div>
            Mapped Changes <span id="changeMappedCount">{x}</span>
          </div>
        )}
      />
      <ChangeMapped2
        children={(x) => (
          <div>
            Mapped Value <span id="mappedSum">{x}</span>
          </div>
        )}
      />
      <div>
        Child1: <Finput state={child1} type="number" />
      </div>
      <div>
        Child2: <Finput state={child2} type="number" />
      </div>
      <div>
        <button id="inc1" onClick={() => child1.value++}>
          Increment child1
        </button>
        <button id="inc2" onClick={() => child2.value++}>
          Increment child2
        </button>
        <button
          id="reset"
          onClick={() => (form.value = { child1: 0, child2: 0 })}
        >
          Reset
        </button>
      </div>
    </div>
  );
}
