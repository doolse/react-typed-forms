import React from "react";
import { RenderForm, useControlEffect } from "../react-hooks";
import { Control } from "../types";

// Only allow strings and numbers
export type FselectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  state: Control<string | number | undefined>;
};

export function Fselect({ state, children, ...others }: FselectProps) {
  // Update the HTML5 custom validity whenever the error message is changed/cleared
  useControlEffect(
    () => state.error,
    (s) => (state.element as HTMLSelectElement)?.setCustomValidity(s ?? "")
  );

  return (
    <RenderForm
      control={state}
      children={({ errorText, ...theseProps }) => (
        <select
          {...theseProps}
          ref={(r) => {
            state.element = r;
            if (r) r.setCustomValidity(state.current.error ?? "");
          }}
          {...others}
        >
          {children}
        </select>
      )}
    />
  );
}
