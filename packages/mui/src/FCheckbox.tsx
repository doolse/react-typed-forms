import { Control, formControlProps } from "@react-typed-forms/core";
import {
  Checkbox,
  FormControlLabel,
  FormControlLabelProps,
} from "@mui/material";
import React, { FC } from "react";

export const FCheckbox: FC<
  Omit<FormControlLabelProps, "control"> & {
    state: Control<boolean | undefined | null>;
  }
> = ({ state, ...props }) => {
  const { ref, value, disabled } = formControlProps(state);
  return (
    <FormControlLabel
      control={
        <Checkbox
          ref={ref}
          checked={Boolean(value)}
          disabled={disabled}
          onChange={(_, v) => {
            state.value = v;
            state.touched = true;
          }}
        />
      }
      {...props}
    />
  );
};
