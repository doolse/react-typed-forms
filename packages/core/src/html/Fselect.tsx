import React from "react";
import {
  genericProps,
  useControlChangeEffect,
  useControlStateVersion,
} from "../react-hooks";
import { Control, ControlChange } from "../types";

// Only allow strings and numbers
export type FselectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  state: Control<string | number | undefined>;
};

export function Fselect({ state, children, ...others }: FselectProps) {
  // Re-render on value or disabled state change
  useControlStateVersion(state, ControlChange.Value | ControlChange.Disabled);

  // Update the HTML5 custom validity whenever the error message is changed/cleared
  useControlChangeEffect(
    state,
    (s) =>
      (s.element as HTMLSelectElement)?.setCustomValidity(state.error ?? ""),
    ControlChange.Error
  );
  const { errorText, ...theseProps } = genericProps(state);
  return (
    <select
      {...theseProps}
      ref={(r) => {
        state.element = r;
        if (r) r.setCustomValidity(state.error ?? "");
      }}
      {...others}
    >
      {children}
    </select>
  );
}
