import React from "react";
import { useControlEffect } from "../react-hooks";
import { Control } from "../types";
import { RenderForm } from "../components";

// Only allow strings and numbers
export type FselectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  control: Control<string | number | undefined>;
};

export function Fselect({ control, children, ...others }: FselectProps) {
  // Update the HTML5 custom validity whenever the error message is changed/cleared
  useControlEffect(
    () => control.error,
    (s) => (control.element as HTMLSelectElement)?.setCustomValidity(s ?? "")
  );

  return (
    <RenderForm
      control={control}
      children={({ errorText, ...theseProps }) => (
        <select
          {...theseProps}
          ref={(r) => {
            control.element = r;
            if (r) r.setCustomValidity(control.current.error ?? "");
          }}
          {...others}
        >
          {children}
        </select>
      )}
    />
  );
}
