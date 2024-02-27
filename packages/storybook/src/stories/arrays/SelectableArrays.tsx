import {
  Control,
  ensureSelectableValues,
  Fcheckbox,
  Finput,
  notEmpty,
  removeElement,
  RenderElements,
  SelectionGroup,
  useControl,
  useControlEffect,
  useSelectableArray,
} from "@react-typed-forms/core";
import React, { useRef } from "react";
import { useState } from "@storybook/preview-api";
import { PlainStory } from "@/index";

// language=text
const selectableArraysExampleCode = `
// Example code
interface FormData {
  people: RowForm[];
  other: string;
}

type RowForm = {
  first: string;
  last: string;
};

const selected: RowForm[] = [{ first: "Jolse", last: "Maginnis" }];

const allDefaults: RowForm[] = ["Jolse", "Thomas", "Nicholas"].map((x) => ({
  first: x,
  last: "",
}));

function StructuredRow({
  state,
  index,
  onDelete,
}: {
  state: Control<SelectionGroup<RowForm>>;
  index: number;
  onDelete: () => void;
}) {
  const c = state.fields.value.fields;
  return (
    <div
      className={\`flex flex-col gap-2 bg-surface-100 row_$\{index\} rounded-lg px-2 py-4\`}
    >
      <div>
        <label className="mx-2">Enabled:</label>
        <Fcheckbox control={state.fields.selected} className="enabled" />
      </div>
      <div>
        <label className="mx-2">First:</label>
        <Finput
          type="text"
          className="firstField form-control"
          control={c.first}
        />
      </div>
      <div>
        <label className="mx-2">Last:</label>
        <Finput
          type="text"
          className="lastField form-control"
          control={c.last}
        />
      </div>
      <div className="flex justify-center">
        <button className="btn-primary" onClick={onDelete}>
          Delete
        </button>
      </div>
    </div>
  );
}

export function SelectableArrays() {
  const renders = useRef(0);
  renders.current++;

  const allFormState = useControl<FormData>(
    { other: "HI", people: selected },
    {
      fields: {
        people: {
          elems: {
            fields: { first: { validator: notEmpty("Please enter") } },
          },
        },
      },
    },
  );

  const [reset, setReset] = useState(0);

  const selectableArrayFormState = useSelectableArray(
    allFormState.fields.people,
    ensureSelectableValues(allDefaults, (x) => x.first),
    undefined,
    reset,
  );
  const [formData, setFormData] = useState<RowForm[]>([]);

  useControlEffect(
    () => allFormState.value,
    (v) => {
      setFormData(allFormState.fields.people.current.value);
    },
    true,
  );

  return (
    <div className="grid grid-cols-[400px,_1fr] p-4 gap-4">
      <div className="flex flex-col gap-2">
        <h2>Array Selections Example - {renders.current} render(s)</h2>
        <h5>Structured elements</h5>
        <div className="flex flex-col gap-4">
          <RenderElements control={selectableArrayFormState}>
            {(x, idx) => (
              <StructuredRow
                state={x}
                key={x.uniqueId}
                index={idx}
                onDelete={() => {
                  x.fields.selected.value = false;
                  removeElement(selectableArrayFormState, x);
                }}
              />
            )}
          </RenderElements>
        </div>
        <div>
          <button
            id="toggleDisabled"
            className="btn-primary"
            onClick={() => {
              selectableArrayFormState.disabled =
                !selectableArrayFormState.current.disabled;
            }}
          >
            Toggle disabled
          </button>{" "}
          <button
            id="clean"
            className="btn-primary"
            onClick={() => {
              allFormState.markAsClean();
            }}
          >
            Mark Clean
          </button>{" "}
          <button
            id="setValue"
            className="btn-primary"
            onClick={() => {
              allFormState.fields.people.value = [
                { first: "Thomas", last: "" },
                { first: "Derek", last: "Chongster" },
              ];
              setReset((x) => x + 1);
            }}
          >
            Set Value
          </button>
        </div>
        <div>
          {formData && (
            <pre className="my-2">{JSON.stringify(formData, undefined, 2)}</pre>
          )}
        </div>
      </div>
      <div className="relative">
        <div className="flex flex-col gap-4 sticky top-4">
          {allFormState.dirty ? (
            <span className="max-w-xl bg-danger-500 flex items-center justify-center max-h-8 min-w-4 px-4 py-1 rounded-full text-center text-white">
              Dirty
            </span>
          ) : (
            <span className="max-w-xl bg-success-500 flex items-center justify-center max-h-8 min-w-4 px-4 py-1 rounded-full text-center text-white">
              Not dirty
            </span>
          )}

          <div className="grid grid-cols-2">
            <div>
              <h2> All form state initial value:</h2>
              {
                <pre className="my-2">
                  {JSON.stringify(allFormState.initialValue, undefined, 2)}
                </pre>
              }
            </div>

            <div>
              <h2>All form state current value:</h2>
              {
                <pre className="my-2">
                  {JSON.stringify(allFormState.value, undefined, 2)}
                </pre>
              }
            </div>
          </div>

          <div>
            {allFormState.valid ? (
              <span className="max-w-xl bg-success-500 flex items-center justify-center max-h-8 min-w-4 px-4 py-1 rounded-full text-center text-white">
                Valid
              </span>
            ) : (
              <span className="max-w-xl bg-danger-500 flex items-center justify-center max-h-8 min-w-4 px-4 py-1 rounded-full text-center text-white">
                Not Valid
              </span>
            )}
            <h2>Reason: selected element(s) first name must not be empty*</h2>
            <div>
              {\`fields: { first: { validator: notEmpty("Please enter") } }\`}{" "}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
`;

interface FormData {
  people: RowForm[];
  other: string;
}

type RowForm = {
  first: string;
  last: string;
};

const selected: RowForm[] = [{ first: "Jolse", last: "Maginnis" }];

const allDefaults: RowForm[] = ["Jolse", "Thomas", "Nicholas"].map((x) => ({
  first: x,
  last: "",
}));

function StructuredRow({
  state,
  index,
  onDelete,
}: {
  state: Control<SelectionGroup<RowForm>>;
  index: number;
  onDelete: () => void;
}) {
  const c = state.fields.value.fields;
  return (
    <div
      className={`flex flex-col gap-2 bg-surface-100 row_${index} rounded-lg px-2 py-4`}
    >
      <div>
        <label className="mx-2">Enabled:</label>
        <Fcheckbox control={state.fields.selected} className="enabled" />
      </div>
      <div>
        <label className="mx-2">First:</label>
        <Finput
          type="text"
          className="firstField form-control"
          control={c.first}
        />
      </div>
      <div>
        <label className="mx-2">Last:</label>
        <Finput
          type="text"
          className="lastField form-control"
          control={c.last}
        />
      </div>
      <div className="flex justify-center">
        <button className="btn-primary" onClick={onDelete}>
          Delete
        </button>
      </div>
    </div>
  );
}

export const SelectableArrays: PlainStory = {
  parameters: {
    docs: {
      source: {
        language: "tsx",
        code: selectableArraysExampleCode,
      },
    },
  },
  render: () => {
    // Force to update storybook canvas
    const [_, setForceUpdate] = useState(false);

    const renders = useRef(0);
    renders.current++;

    const allFormState = useControl<FormData>(
      { other: "HI", people: selected },
      {
        fields: {
          people: {
            elems: {
              fields: { first: { validator: notEmpty("Please enter") } },
            },
          },
        },
      },
    );

    const [reset, setReset] = useState(0);

    const selectableArrayFormState = useSelectableArray(
      allFormState.fields.people,
      ensureSelectableValues(allDefaults, (x) => x.first),
      undefined,
      reset,
    );
    const [formData, setFormData] = useState<RowForm[]>([]);

    useControlEffect(
      () => allFormState.value,
      (v) => {
        setFormData(allFormState.fields.people.current.value);
      },
      true,
    );

    return (
      <div className="grid grid-cols-[400px,_1fr] p-4 gap-4">
        <div className="flex flex-col gap-2">
          <h2>Array Selections Example - {renders.current} render(s)</h2>
          <h5>Structured elements</h5>
          <div className="flex flex-col gap-4">
            <RenderElements control={selectableArrayFormState}>
              {(x, idx) => (
                <StructuredRow
                  state={x}
                  key={x.uniqueId}
                  index={idx}
                  onDelete={() => {
                    x.fields.selected.value = false;
                    removeElement(selectableArrayFormState, x);
                  }}
                />
              )}
            </RenderElements>
          </div>
          <div>
            <button
              id="toggleDisabled"
              className="btn-primary"
              onClick={() => {
                selectableArrayFormState.disabled =
                  !selectableArrayFormState.current.disabled;
                setForceUpdate((x) => !x);
              }}
            >
              Toggle disabled
            </button>{" "}
            <button
              id="clean"
              className="btn-primary"
              onClick={() => {
                allFormState.markAsClean();
                setForceUpdate((x) => !x);
              }}
            >
              Mark Clean
            </button>{" "}
            <button
              id="setValue"
              className="btn-primary"
              onClick={() => {
                allFormState.fields.people.value = [
                  { first: "Thomas", last: "" },
                  { first: "Derek", last: "Chongster" },
                ];
                setReset((x) => x + 1);
              }}
            >
              Set Value
            </button>
          </div>
          <div>
            {formData && (
              <pre className="my-2">
                {JSON.stringify(formData, undefined, 2)}
              </pre>
            )}
          </div>
        </div>
        <div className="relative">
          <div className="flex flex-col gap-4 sticky top-4">
            {allFormState.dirty ? (
              <span className="max-w-xl bg-danger-500 flex items-center justify-center max-h-8 min-w-4 px-4 py-1 rounded-full text-center text-white">
                Dirty
              </span>
            ) : (
              <span className="max-w-xl bg-success-500 flex items-center justify-center max-h-8 min-w-4 px-4 py-1 rounded-full text-center text-white">
                Not dirty
              </span>
            )}

            <div className="grid grid-cols-2">
              <div>
                <h2> All form state initial value:</h2>
                {
                  <pre className="my-2">
                    {JSON.stringify(allFormState.initialValue, undefined, 2)}
                  </pre>
                }
              </div>

              <div>
                <h2>All form state current value:</h2>
                {
                  <pre className="my-2">
                    {JSON.stringify(allFormState.value, undefined, 2)}
                  </pre>
                }
              </div>
            </div>

            <div>
              {allFormState.valid ? (
                <span className="max-w-xl bg-success-500 flex items-center justify-center max-h-8 min-w-4 px-4 py-1 rounded-full text-center text-white">
                  Valid
                </span>
              ) : (
                <span className="max-w-xl bg-danger-500 flex items-center justify-center max-h-8 min-w-4 px-4 py-1 rounded-full text-center text-white">
                  Not Valid
                </span>
              )}
              <h2>Reason: selected element(s) first name must not be empty*</h2>
              <div>
                {`fields: { first: { validator: notEmpty("Please enter") } }`}{" "}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  },
};
