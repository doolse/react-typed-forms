import React from "react";
import { formControlProps, useControlEffect } from "../react-hooks";
import { Control } from "../types";

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
  const { errorText, ...theseProps } = formControlProps(control);

  return (
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
  );
}
