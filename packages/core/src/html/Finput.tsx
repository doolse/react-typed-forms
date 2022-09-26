import React from "react";
import { ControlChange, Control } from "../nodes";
import {
  genericProps,
  useControlChangeEffect,
  useControlStateVersion,
} from "../react-hooks";

// Only allow strings and numbers
export type FinputProps<V extends string | number> =
  React.InputHTMLAttributes<HTMLInputElement> & {
    state: Control<V>;
  };

export function Finput<V extends string | number>({
  state,
  ...others
}: FinputProps<V>) {
  // Re-render on value or disabled state change
  useControlStateVersion(state, ControlChange.Value | ControlChange.Disabled);

  // Update the HTML5 custom validity whenever the error message is changed/cleared
  useControlChangeEffect(
    state,
    (s) =>
      (state.element as HTMLInputElement)?.setCustomValidity(state.error ?? ""),
    ControlChange.Error
  );
  const { errorText, ...theseProps } = genericProps(state);
  return (
    <input
      {...theseProps}
      ref={(r) => {
        state.element = r;
        if (r) r.setCustomValidity(state.error ?? "");
      }}
      {...others}
    />
  );
}
