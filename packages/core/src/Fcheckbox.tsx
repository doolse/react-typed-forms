import React from "react";
import { formControlProps, useControlEffect } from "./hooks";
import {Control} from "@astroapps/controls";

export type FcheckboxProps = React.InputHTMLAttributes<HTMLInputElement> & {
  control: Control<boolean | undefined | null>;
  type?: "checkbox" | "radio";
};

export function Fcheckbox({
  control,
  type = "checkbox",
  ...others
}: FcheckboxProps) {
  // Update the HTML5 custom validity whenever the error message is changed/cleared
  useControlEffect(
    () => control.error,
    (s) => (control.element as HTMLInputElement)?.setCustomValidity(s ?? ""),
  );
  const { value, onChange, errorText, ...theseProps } =
    formControlProps(control);
  return (
    <input
      {...theseProps}
      checked={!!value}
      ref={(r) => {
        control.element = r;
        if (r) r.setCustomValidity(control.current.error ?? "");
      }}
      onChange={(e) => (control.value = e.target.checked)}
      type={type}
      {...others}
    />
  );
}
