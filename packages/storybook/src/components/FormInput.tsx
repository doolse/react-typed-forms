import React, { ReactNode } from "react";
import {
  Control,
  formControlProps,
  useControlEffect,
} from "@react-typed-forms/core";

export function FormInput({
  state,
  label,
  showValid,
  id,
  controlTouched,
  ...others
}: React.InputHTMLAttributes<HTMLInputElement> & {
  state: Control<string | number>;
  label: ReactNode;
  showValid?: boolean;
  controlTouched?: (v: boolean) => void; // internal usage
}) {
  const { errorText, ...formProps } = formControlProps(state);

  useControlEffect(
    () => state.touched,
    (v) => controlTouched?.(v),
  );

  return (
    <div className="flex gap-2 items-center" id={id}>
      {label && <label>{label}</label>}
      <input
        {...formProps}
        className={`form-control ${
          state.touched
            ? showValid
              ? state.valid
                ? "is-valid"
                : "is-invalid"
              : ""
            : ""
        }`}
        {...others}
      />
      {errorText ? <span className="badge-error">{errorText}</span> : <></>}
    </div>
  );
}
