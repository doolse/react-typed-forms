import { Meta } from "@storybook/react";
import { PlainStory } from "@/index";
import React from "react";
import { FNumberField, FTextField } from "@react-typed-forms/mui";
import {
  useControl,
  useControlEffect,
  useControlGroup,
  useValueChangeEffect,
} from "@react-typed-forms/core";
import { useState } from "@storybook/preview-api";

const meta: Meta<{}> = {
  title: "React typed forms/Advanced/Sub Groups",
  component: undefined,
  parameters: {
    docs: {
      description: {
        component: "Some advanced examples",
      },
      source: {
        language: "tsx",
        code: "",
      },
    },
  },
};

export default meta;

//language=text
const subGroupsExampleCode = `
// Example code
interface FullGroup {
  firstName: string;
  age: number;
  anotherField: string;
}

export function SubGroupsExample() {
  const formState = useControl<FullGroup>({
    age: 0,
    firstName: "",
    anotherField: "",
  });
  const fields = formState.fields;
  const subForm = useControlGroup({
    age: fields.age,
    firstName: fields.firstName,
  });
  const [parentUpdates, setParentUpdates] = useState(0);
  const [valueUpdates, setValueUpdates] = useState(0);
  const [debouncedUpdates, setDebouncedUpdates] = useState(0);

  useControlEffect(
    () => subForm.value,
    () => setValueUpdates((x) => x + 1),
  );
  useControlEffect(
    () => formState.value,
    () => setParentUpdates((x) => x + 1),
  );
  useValueChangeEffect(subForm, () => setDebouncedUpdates((x) => x + 1), 1000);

  return (
    <div className="flex flex-col gap-4">
      <h2>Group Test</h2>
      <div>
        <FTextField
          label="First Name"
          id="firstName"
          state={fields.firstName}
        />
      </div>
      <div>
        <FTextField
          label="Another field"
          id="anotherField"
          state={fields.anotherField}
        />
      </div>
      <div>
        <FNumberField id="age" label="Age" state={fields.age} />
      </div>
      <div>
        SubGroup updates: <span id="updateCount">{valueUpdates}</span>
      </div>
      <div>
        Parent updates: <span id="updateParentCount">{parentUpdates}</span>
      </div>
      <div>
        Debounced subgroup updates:{" "}
        <span id="updateDebouncedCount">{debouncedUpdates}</span>
      </div>
      <div className="btn-group">
        <button
          id="resetData"
          className="btn-primary"
          onClick={(e) => {
            e.preventDefault();
            formState.value = {
              age: 10,
              anotherField: "WOW",
              firstName: "Reset",
            };
          }}
        >
          Reset data
        </button>
        <button
          id="resetSubData"
          className="btn-primary"
          onClick={(e) => {
            e.preventDefault();
            subForm.value = {
              age: 5,
              firstName: "cool",
            };
          }}
        >
          Reset Sub data
        </button>
      </div>
    </div>
  );
}
`;

interface FullGroup {
  firstName: string;
  age: number;
  anotherField: string;
}

export const SubGroups: PlainStory = {
  parameters: {
    docs: {
      source: {
        language: "tsx",
        code: subGroupsExampleCode,
      },
    },
  },
  render: () => {
    const formState = useControl<FullGroup>({
      age: 0,
      firstName: "",
      anotherField: "",
    });
    const fields = formState.fields;
    const subForm = useControlGroup({
      age: fields.age,
      firstName: fields.firstName,
    });
    const [parentUpdates, setParentUpdates] = useState(0);
    const [valueUpdates, setValueUpdates] = useState(0);
    const [debouncedUpdates, setDebouncedUpdates] = useState(0);

    useControlEffect(
      () => subForm.value,
      () => setValueUpdates((x) => x + 1),
    );
    useControlEffect(
      () => formState.value,
      () => setParentUpdates((x) => x + 1),
    );
    useValueChangeEffect(
      subForm,
      () => setDebouncedUpdates((x) => x + 1),
      1000,
    );

    return (
      <div className="flex flex-col gap-4">
        <h2>Group Test</h2>
        <div>
          <FTextField
            label="First Name"
            id="firstName"
            state={fields.firstName}
          />
        </div>
        <div>
          <FTextField
            label="Another field"
            id="anotherField"
            state={fields.anotherField}
          />
        </div>
        <div>
          <FNumberField id="age" label="Age" state={fields.age} />
        </div>
        <div>
          SubGroup updates: <span id="updateCount">{valueUpdates}</span>
        </div>
        <div>
          Parent updates: <span id="updateParentCount">{parentUpdates}</span>
        </div>
        <div>
          Debounced subgroup updates:{" "}
          <span id="updateDebouncedCount">{debouncedUpdates}</span>
        </div>
        <div className="btn-group">
          <button
            id="resetData"
            className="btn-primary"
            onClick={(e) => {
              e.preventDefault();
              formState.value = {
                age: 10,
                anotherField: "WOW",
                firstName: "Reset",
              };
            }}
          >
            Reset data
          </button>
          <button
            id="resetSubData"
            className="btn-primary"
            onClick={(e) => {
              e.preventDefault();
              subForm.value = {
                age: 5,
                firstName: "cool",
              };
            }}
          >
            Reset Sub data
          </button>
        </div>
      </div>
    );
  },
};
