import { Control, RenderForm } from "@react-typed-forms/core";
import {
  Checkbox,
  FormControlLabel,
  FormControlLabelProps,
} from "@mui/material";
import React, { FC } from "react";

export const FCheckbox: FC<
  Omit<FormControlLabelProps, "control"> & {
    state: Control<boolean | undefined>;
  }
> = ({ state, ...props }) => (
  <RenderForm
    control={state}
    children={({ value, disabled, ref }) => (
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
    )}
  />
);
