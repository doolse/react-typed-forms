import { TextField, TextFieldProps } from "@mui/material";
import { Control, RenderForm } from "@react-typed-forms/core";
import React, { FC } from "react";

export const FDateField: FC<
  TextFieldProps & { state: Control<string | undefined | null> }
> = ({ state, helperText, ...props }) => (
  <RenderForm
    control={state}
    children={({ errorText, value, ...formProps }) => (
      <TextField
        {...formProps}
        value={!value ? "" : value}
        error={Boolean(errorText)}
        {...props}
        type="date"
        helperText={errorText ?? helperText}
        InputLabelProps={{ shrink: true }}
      />
    )}
  />
);
