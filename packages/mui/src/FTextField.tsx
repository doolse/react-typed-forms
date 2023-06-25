import { TextField, TextFieldProps } from "@mui/material";
import { Control, formControlProps } from "@react-typed-forms/core";
import React from "react";

export type FTextFieldProps = TextFieldProps & {
  state: Control<string | undefined | null>;
};

export function FTextField({ state, helperText, ...props }: FTextFieldProps) {
  const { errorText, value, ...formProps } = formControlProps(state);
  return (
    <TextField
      {...formProps}
      value={!value ? "" : value}
      error={Boolean(errorText)}
      {...props}
      helperText={errorText ?? helperText}
    />
  );
}
