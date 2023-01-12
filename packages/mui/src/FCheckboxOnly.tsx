import { Control, RenderForm } from "@react-typed-forms/core";
import { Checkbox } from "@mui/material";
import React from "react";

export function FCheckboxOnly({ state }: { state: Control<boolean> }) {
  return (
    <RenderForm
      control={state}
      children={({ value, disabled }) => (
        <Checkbox
          onChange={(_, v) => (state.value = v)}
          checked={value}
          disabled={disabled}
          color={"primary"}
        />
      )}
    />
  );
}
