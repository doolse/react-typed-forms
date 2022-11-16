import { TextField, TextFieldProps } from "@mui/material";
import React, { FC, ReactElement } from "react";

import { Control, RenderForm, useComputed } from "@react-typed-forms/core";

export type FTextFieldProps = TextFieldProps & {
  state: Control<string | undefined | null>;
};

export const FTextField: FC<FTextFieldProps> = ({
  state,
  helperText,
  ...props
}) => (
  <RenderForm
    control={state}
    children={({ value, errorText, ...formProps }) => (
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

export type FNumberFieldProps = {
  state: Control<number | null | undefined>;
  invalidError?: string | undefined;
  blankError?: string | undefined;
} & TextFieldProps;

export function FNumberField({
  state,
  invalidError,
  blankError,
  helperText,
  ...others
}: FNumberFieldProps): ReactElement {
  const text = useComputed(() => state.value?.toString() ?? "");
  return (
    <RenderForm
      control={state}
      children={({ errorText, ...formProps }) => {
        return (
          <TextField
            {...formProps}
            {...others}
            value={text.value}
            error={Boolean(errorText)}
            helperText={errorText ?? helperText}
            onChange={(e) => {
              const textVal = e.target.value;
              text.value = textVal;
              if (!textVal) {
                if (blankError) {
                  state.setError(blankError);
                } else {
                  state.setValue(null);
                }
              } else {
                const value = parseFloat(textVal);
                if (!isNaN(value)) {
                  state.setValue(value);
                } else {
                  state.setError(invalidError);
                }
              }
            }}
          />
        );
      }}
    />
  );
}
