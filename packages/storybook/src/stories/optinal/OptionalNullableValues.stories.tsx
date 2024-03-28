import { Meta } from "@storybook/react";
import { PlainStory } from "@/index";
import {
  addElement,
  RenderElements,
  RenderOptional,
  useControl,
  useControlEffect,
} from "@react-typed-forms/core";
import { FNumberField, FTextField } from "@react-typed-forms/mui";
import { useState } from "@storybook/preview-api";

const meta: Meta<{}> = {
  title: "React typed forms/Optional Nullable Values",
  component: undefined,
};

export default meta;

//language=text
const nullableExampleCode = `
// Example code
type Form = {
  firstName?: string;
  age?: number;
  nested?: {
    optional: string | undefined;
  };
  optionalStrings?: string[];
  nullableStruct: { id: string } | null;
};


export function OptionalNullableValuesExample() {
  const formState = useControl<Form>({
    nested: { optional: undefined },
    nullableStruct: null,
  });
  const fields = formState.fields;
  const [formData, setFormData] = useState<Form>(formState.value);

  const nested = fields.nested;
  const optionalArray = fields.optionalStrings;
  const nullable = fields.nullableStruct;

  useControlEffect(
    () => formState.value,
    (v) => {
      setFormData(v);
    },
  );

  return (
    <div className="container flex flex-col gap-4">
      <h2>Optionals Test</h2>
      <div>
        <FTextField
          label="First Name"
          id="firstName"
          state={fields.firstName}
        />
      </div>
      <div>
        <FNumberField id="age" label="Age" state={fields.age} />
      </div>
      <RenderOptional control={nested}>
        {(c) => (
          <div>
            <FTextField
              id="optionalField"
              label="Nested Optional"
              state={c.fields.optional}
            />
          </div>
        )}
      </RenderOptional>
      <RenderElements control={optionalArray}>
        {(x) => (
          <div>
            <FTextField label="String elem" state={x} />
          </div>
        )}
      </RenderElements>

      <RenderOptional
        control={nullable}
        children={(c) => (
          <div>
            <FTextField state={c.fields.id} label="Nullable" />
          </div>
        )}
      />
      <div className="flex flex-row gap-4 flex-wrap">
        <button
          id="addOptionalString"
          className="btn-primary"
          onClick={() => {
            addElement(optionalArray, "");
          }}
        >
          Add optional string
        </button>
        <button
          id="clearStrings"
          className="btn-primary"
          onClick={(e) => {
            e.preventDefault();
            formState.setValue((v) => ({
              ...v,
              optionalStrings: undefined,
            }));
          }}
        >
          Clear strings
        </button>
        <button
          id="clearNested"
          className="btn-primary"
          onClick={(e) => {
            e.preventDefault();
            formState.setValue((v) => ({ ...v, nested: undefined }));
          }}
        >
          Clear nested
        </button>
        <button
          id="unClearNested"
          className="btn-primary"
          onClick={(e) => {
            e.preventDefault();
            formState.setValue((v) => ({
              ...v,
              nested: { optional: "optional" },
            }));
          }}
        >
          Unclear nested
        </button>
        <button
          id="resetData"
          className="btn-primary"
          onClick={(e) => {
            e.preventDefault();
            formState.value = {
              nested: { optional: undefined },
              nullableStruct: null,
            };
          }}
        >
          Reset data
        </button>
        <button
          id="toggleNullable"
          className="btn-primary"
          onClick={(e) => {
            e.preventDefault();
            formState.setValue((v) => ({
              ...v,
              nullableStruct: v.nullableStruct ? null : { id: "hi" },
            }));
          }}
        >
          Toggle nullable
        </button>
      </div>
      {formData && (
        <pre className="my-2">{JSON.stringify(formData, undefined, 2)}</pre>
      )}
    </div>
  );
}
`;

type Form = {
  firstName?: string;
  age?: number;
  nested?: {
    optional: string | undefined;
  };
  optionalStrings?: string[];
  nullableStruct: { id: string } | null;
};

export const OptionalNullableValues: PlainStory = {
  parameters: {
    docs: {
      description: {
        story: "Optional nullable values description",
      },
      source: {
        language: "tsx",
        code: nullableExampleCode,
      },
    },
  },
  render: () => {
    const formState = useControl<Form>({
      nested: { optional: undefined },
      nullableStruct: null,
    });
    const fields = formState.fields;
    const [formData, setFormData] = useState<Form>(formState.value);

    const nested = fields.nested;
    const optionalArray = fields.optionalStrings;
    const nullable = fields.nullableStruct;

    useControlEffect(
      () => formState.value,
      (v) => {
        setFormData(v);
      },
    );

    return (
      <div className="container flex flex-col gap-4">
        <h2>Optionals Test</h2>
        <div>
          <FTextField
            label="First Name"
            id="firstName"
            state={fields.firstName}
          />
        </div>
        <div>
          <FNumberField id="age" label="Age" state={fields.age} />
        </div>
        <RenderOptional control={nested}>
          {(c) => (
            <div>
              <FTextField
                id="optionalField"
                label="Nested Optional"
                state={c.fields.optional}
              />
            </div>
          )}
        </RenderOptional>
        <RenderElements control={optionalArray}>
          {(x) => (
            <div>
              <FTextField label="String elem" state={x} />
            </div>
          )}
        </RenderElements>

        <RenderOptional
          control={nullable}
          children={(c) => (
            <div>
              <FTextField state={c.fields.id} label="Nullable" />
            </div>
          )}
        />
        <div className="btn-group">
          <button
            id="addOptionalString"
            className="btn-primary"
            onClick={() => {
              addElement(optionalArray, "");
            }}
          >
            Add optional string
          </button>
          <button
            id="clearStrings"
            className="btn-primary"
            onClick={(e) => {
              e.preventDefault();
              formState.setValue((v) => ({
                ...v,
                optionalStrings: undefined,
              }));
            }}
          >
            Clear strings
          </button>
          <button
            id="clearNested"
            className="btn-primary"
            onClick={(e) => {
              e.preventDefault();
              formState.setValue((v) => ({ ...v, nested: undefined }));
            }}
          >
            Clear nested
          </button>
          <button
            id="unClearNested"
            className="btn-primary"
            onClick={(e) => {
              e.preventDefault();
              formState.setValue((v) => ({
                ...v,
                nested: { optional: "optional" },
              }));
            }}
          >
            Unclear nested
          </button>
          <button
            id="resetData"
            className="btn-primary"
            onClick={(e) => {
              e.preventDefault();
              formState.value = {
                nested: { optional: undefined },
                nullableStruct: null,
              };
            }}
          >
            Reset data
          </button>
          <button
            id="toggleNullable"
            className="btn-primary"
            onClick={(e) => {
              e.preventDefault();
              formState.setValue((v) => ({
                ...v,
                nullableStruct: v.nullableStruct ? null : { id: "hi" },
              }));
            }}
          >
            Toggle nullable
          </button>
        </div>
        {formData && (
          <pre className="my-2">{JSON.stringify(formData, undefined, 2)}</pre>
        )}
      </div>
    );
  },
};
