import { useNodeStateVersion, ValueNode } from "@react-typed-forms/core";
import React, { ReactNode } from "react";

export function FormInput({
  state,
  label,
  showValid,
  id,
  ...others
}: React.InputHTMLAttributes<HTMLInputElement> & {
  state: ValueNode<string | number>;
  label: ReactNode;
  showValid?: boolean;
}) {
  useNodeStateVersion(state);
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
