import React from "react";
import { ControlChange, Control } from "../nodes";
import {
  genericProps,
  useControlChangeEffect,
  useControlStateVersion,
} from "../react-hooks";

export type FcheckboxProps = React.InputHTMLAttributes<HTMLInputElement> & {
  state: Control<boolean>;
  type?: "checkbox" | "radio";
};

export function Fcheckbox({
  state,
  type = "checkbox",
  ...others
}: FcheckboxProps) {
  // Re-render on value or disabled state change
  useControlStateVersion(state, ControlChange.Value | ControlChange.Disabled);

  // Update the HTML5 custom validity whenever the error message is changed/cleared
  useControlChangeEffect(
    state,
    (s) =>
      (state.element as HTMLInputElement)?.setCustomValidity(state.error ?? ""),
    ControlChange.Error
  );
  const { value, onChange, errorText, ...theseProps } = genericProps(state);
  return (
    <input
      {...theseProps}
      checked={value}
      ref={(r) => {
        state.element = r;
        if (r) r.setCustomValidity(state.error ?? "");
      }}
      onChange={(e) => state.setValue(!value)}
      type={type}
      {...others}
    />
  );
}
