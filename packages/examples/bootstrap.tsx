import { FormControl, useFormStateVersion } from "@react-typed-form/core";
import React, { ReactNode } from "react";

export function FormInput({
  state,
  label,
  showValid,
  ...others
}: React.InputHTMLAttributes<HTMLInputElement> & {
  state: FormControl<string | number>;
  label: ReactNode;
  showValid?: boolean;
}) {
  useFormStateVersion(state);
  return (
    <div className="form-group">
      {label && <label>{label}</label>}
      <input
        value={state.value}
        disabled={state.disabled}
        onChange={(e) => state.setValue(e.currentTarget.value)}
        onBlur={() => state.setShowValidation(true)}
        className={`form-control ${
          state.showValidation
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
