import React from "react";
import { RenderForm, useControlEffect } from "../react-hooks";
import { Control } from "../types";

export type FcheckboxProps = React.InputHTMLAttributes<HTMLInputElement> & {
  state: Control<boolean>;
  type?: "checkbox" | "radio";
};

export function Fcheckbox({
  state,
  type = "checkbox",
  ...others
}: FcheckboxProps) {
  // Update the HTML5 custom validity whenever the error message is changed/cleared
  useControlEffect(
    () => state.error,
    (s) => (state.element as HTMLInputElement)?.setCustomValidity(s ?? "")
  );
  return (
    <RenderForm
      control={state}
      children={({ value, onChange, errorText, ...theseProps }) => (
        <input
          {...theseProps}
          checked={value}
          ref={(r) => {
            state.element = r;
            if (r) r.setCustomValidity(state.current.error ?? "");
          }}
          onChange={(e) => (state.value = !value)}
          type={type}
          {...others}
        />
      )}
    />
  );
}
