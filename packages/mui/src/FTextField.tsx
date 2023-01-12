import { TextField, TextFieldProps } from "@mui/material";
import { Control, RenderForm } from "@react-typed-forms/core";
import React from "react";

export type FTextFieldProps = TextFieldProps & {
  state: Control<string | undefined | null>;
};

export function FTextField({ state, helperText, ...props }: FTextFieldProps) {
  return (
    <RenderForm
      control={state}
      children={({ errorText, value, ...formProps }) => (
        <TextField
          {...formProps}
          value={!value ? "" : value}
          error={Boolean(errorText)}
          {...props}
          helperText={errorText ?? helperText}
        />
      )}
    />
  );
}
