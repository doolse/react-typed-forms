import { useControl } from "@react-typed-forms/core";
import { FormInput } from "../bootstrap";
import React from "react";

export default function ErrorsExample() {
  const control = useControl("");

  return (
    <div className="container">
      <h2>Errors</h2>
      <FormInput id="field" label="Field:" type="text" state={control} />
      <div>
        <button
          className="btn btn-secondary"
          onClick={() => control.setErrors({ default: "cool" })}
        >
          Cool
        </button>{" "}
        <button
          className="btn btn-secondary"
          onClick={() => control.setErrors({})}
        >
          blank
        </button>{" "}
        <button
          className="btn btn-secondary"
          onClick={() => (control.error = "default")}
        >
          default
        </button>{" "}
        <button
          className="btn btn-secondary"
          onClick={() => control.setError("another", "wow")}
        >
          another wow
        </button>{" "}
        <button
          className="btn btn-secondary"
          onClick={() => control.setErrors({ another: "wow", default: "" })}
        >
          another wow2
        </button>{" "}
      </div>
      <pre className="my-2">{JSON.stringify(control.errors, undefined, 2)}</pre>
    </div>
  );
}
