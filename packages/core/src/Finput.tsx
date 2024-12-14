import React from "react";
import { formControlProps, useControlEffect } from "./hooks";
import { Control } from "@astroapps/controls";

// Only allow strings and numbers
export type FinputProps<V extends string | number> =
  React.InputHTMLAttributes<HTMLInputElement> & {
    control: Control<V>;
  };

export function Finput<V extends string | number>({
  control,
  ...props
}: FinputProps<V>) {
  // Update the HTML5 custom validity whenever the error message is changed/cleared
  useControlEffect(
    () => control.error,
    (s) => (control.element as HTMLInputElement)?.setCustomValidity(s ?? ""),
  );
  const { errorText, value, ...inputProps } = formControlProps(control);
  return (
    <input
      {...inputProps}
      value={value == null ? "" : value}
      ref={(r) => {
        control.element = r;
        if (r) r.setCustomValidity(control.current.error ?? "");
      }}
      {...props}
    />
  );
}
