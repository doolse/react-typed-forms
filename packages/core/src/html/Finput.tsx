import React from "react";
import { RenderForm, useControlEffect } from "../react-hooks";
import { Control } from "../types";

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
    (s) => (control.element as HTMLInputElement)?.setCustomValidity(s ?? "")
  );
  return (
    <RenderForm
      control={control}
      children={({ errorText, value, ...inputProps }) => (
        <input
          {...inputProps}
          value={value == null ? "" : value}
          ref={(r) => {
            control.element = r;
            if (r) r.setCustomValidity(control.current.error ?? "");
          }}
          {...props}
        />
      )}
    />
  );
}
