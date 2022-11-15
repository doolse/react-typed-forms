import { Control, RenderForm, useControlEffect } from "@react-typed-forms/core";
import React from "react";

// Only allow strings and numbers
export type FinputProps<V extends string | number> =
  React.InputHTMLAttributes<HTMLInputElement> & {
    state: Control<V>;
  };

export function Finput<V extends string | number>({
  state,
  ...others
}: FinputProps<V>) {
  // Update the HTML5 custom validity whenever the error message is changed/cleared
  useControlEffect(
    () => state.error,
    (s) => (state.element as HTMLInputElement)?.setCustomValidity(s ?? "")
  );
  return (
    <RenderForm
      control={state}
      children={({ errorText, ...theseProps }) => (
        <input
          {...theseProps}
          ref={(r) => {
            state.element = r;
            if (r) r.setCustomValidity(state.error ?? "");
          }}
          {...others}
        />
      )}
    />
  );
}
