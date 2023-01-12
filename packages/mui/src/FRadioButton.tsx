import { Control, RenderForm } from "@react-typed-forms/core";
import { FormControlLabel, FormControlLabelProps, Radio } from "@mui/material";
import React from "react";
interface FRadioButtonProps<A>
  extends Omit<FormControlLabelProps, "control" | "defaultValue"> {
  state: Control<A>;
  value: A;
  defaultValue: A;
}

export function FRadioButton<A>({
  state,
  value,
  defaultValue,
  ...props
}: FRadioButtonProps<A>) {
  return (
    <RenderForm
      control={state}
      children={({ ref, value: fValue, disabled }) => (
        <FormControlLabel
          control={
            <Radio
              ref={ref}
              name={"_r" + state.uniqueId}
              checked={fValue === value}
              disabled={disabled}
              onChange={(_, v) => {
                state.value = v ? value : defaultValue;
                state.touched = true;
              }}
            />
          }
          {...props}
        />
      )}
    />
  );
}
