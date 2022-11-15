import React, { ReactNode } from "react";
import { Control, RenderForm } from "@react-typed-forms/core";

export function FormInput({
  state,
  label,
  showValid,
  id,
  ...others
}: React.InputHTMLAttributes<HTMLInputElement> & {
  state: Control<string | number>;
  label: ReactNode;
  showValid?: boolean;
}) {
  return (
    <RenderForm
      control={state}
      children={(formProps) => (
        <div className="form-group" id={id}>
          {label && <label>{label}</label>}
          <input
            {...formProps}
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
      )}
    />
  );
}
