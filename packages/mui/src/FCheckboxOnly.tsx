import { Control, formControlProps } from "@react-typed-forms/core";
import { Checkbox } from "@mui/material";
import React from "react";

export function FCheckboxOnly({
  state,
}: {
  state: Control<boolean | null | undefined>;
}) {
  const { value, disabled } = formControlProps(state);
  return (
    <Checkbox
      onChange={(_, v) => (state.value = v)}
      checked={Boolean(value)}
      disabled={disabled}
      color={"primary"}
    />
  );
}
