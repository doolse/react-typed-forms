import {
  buildGroup,
  control,
  Fcheckbox,
  Finput,
  Fselect,
} from "@react-typed-forms/core";
import React, { useRef, useState } from "react";

interface SimpleForm {
  textField: string;
  checked: boolean;
  select: number | undefined;
}

const FormDef = buildGroup<SimpleForm>()({
  select: undefined,
  checked: control(false),
  textField: "",
})();

export default function BasicFormExample() {
  const [formState] = useState(FormDef);
  const { fields } = formState;

  const [formData, setFormData] = useState<SimpleForm>();
  const formRef = useRef<HTMLFormElement>(null);
  return (
    <div className="container">
      <h2>Vanilla HTML forms</h2>
      <p>
        Hitting the toObject() button will also trigger the html5 validity
        errors to show.
      </p>
      <form ref={formRef}>
        <div>
          Text: <Finput type="text" state={fields.textField} />
        </div>
        <div>
          Checkbox: <Fcheckbox type="checkbox" state={fields.checked} />
        </div>
        <div>
          Checkbox: <Fcheckbox type="checkbox" state={fields.checked} />
        </div>
        <div>
          <label>A number:</label>
          <Fselect className="form-control" id="number" state={fields.select}>
            <option value="">None</option>
            <option value="one">1</option>
            <option value="two">2</option>
          </Fselect>
        </div>
        <div>
          <button
            id="submit"
            onClick={(e) => {
              e.preventDefault();
              formRef.current?.reportValidity();
              setFormData(formState.toObject());
            }}
          >
            toObject()
          </button>
        </div>
        {formData && (
          <pre className="my-2">{JSON.stringify(formData, undefined, 2)}</pre>
        )}
      </form>
    </div>
  );
}
