import { FormControl, useControlStateVersion } from "@react-typed-forms/core";
import React, { ReactNode } from "react";

export function FormInput({
  state,
  label,
  showValid,
  id,
  ...others
}: React.InputHTMLAttributes<HTMLInputElement> & {
  state: FormControl<string | number>;
  label: ReactNode;
  showValid?: boolean;
}) {
  useControlStateVersion(state);
  return (
    <div className="form-group" id={id}>
      {label && <label>{label}</label>}
      <input
        value={state.value}
        disabled={state.disabled}
        onChange={(e) => state.setValue(e.currentTarget.value)}
        onBlur={() => state.setTouched(true)}
        className={`form-control ${
          state.touched
            ? state.valid
              ? showValid
                ? "is-valid"
                : ""
              : "is-invalid"
            : ""
        }`}
        {...others}
      />
      <span className="invalid-feedback">{state.error}</span>
    </div>
  );
}
