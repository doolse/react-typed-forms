import { TextField, TextFieldProps } from "@mui/material";
import { Control, RenderForm, useControlEffect } from "@react-typed-forms/core";
import React, { useState } from "react";

export type FNumberFieldProps = TextFieldProps & {
  state: Control<number | undefined | null>;
};

export function FNumberField({
  state,
  onChange,
  helperText,
  ...props
}: FNumberFieldProps) {
  const [field, setField] = useState(makeTextAndValue(state.current.value));

  useControlEffect(
    () => state.value,
    (v) => setField((fv) => (fv[1] === v ? fv : makeTextAndValue(v)))
  );

  return (
    <RenderForm
      control={state}
      children={({ errorText, value, ...formProps }) => (
        <TextField
          {...formProps}
          value={field[0]}
          onChange={(e) => {
            const textValue = e.target.value;
            const v = parseFloat(textValue);
            const newValue = isNaN(v) ? undefined : v;
            setField([textValue, v]);
            state.value = newValue;
          }}
          type="number"
          error={Boolean(errorText)}
          {...props}
          helperText={errorText ?? helperText}
        />
      )}
    />
  );
  function makeTextAndValue(value?: number | null) {
    return [typeof value === "number" ? value : "", value];
  }
}
