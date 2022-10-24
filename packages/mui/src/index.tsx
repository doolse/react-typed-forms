import { TextField, TextFieldProps } from "@mui/material";
import React, { FC, ReactElement, useEffect, useState } from "react";

import {
  useControlStateVersion,
  Control,
  createRenderer,
} from "@react-typed-forms/core";

export type FTextFieldProps = TextFieldProps & {
  state: Control<string | undefined | null>;
};

export const FTextField: FC<FTextFieldProps> = createRenderer<
  string | undefined | null,
  TextFieldProps,
  HTMLInputElement | HTMLTextAreaElement
>(({ state, helperText, ...props }, { errorText, value, ...formProps }) => (
  <TextField
    {...formProps}
    value={!value ? "" : value}
    error={Boolean(errorText)}
    {...props}
    helperText={errorText ?? helperText}
  />
));

export type FNumberFieldProps = {
  state: Control<number | null | undefined>;
  invalidError?: string | undefined;
  blankError?: string | undefined;
} & TextFieldProps;

export function FNumberField({
  state,
  invalidError,
  blankError,
  ...others
}: FNumberFieldProps): ReactElement {
  useControlStateVersion(state);
  const showError = state.touched && !state.valid && Boolean(state.error);
  const [text, setText] = useState(state.value?.toString() ?? "");
  useEffect(() => {
    setText(state.value?.toString() ?? "");
  }, [state.value]);
  return (
    <TextField
      {...others}
      ref={(e) => (state.element = e)}
      value={text}
      error={showError}
      disabled={state.disabled}
      helperText={showError ? state.error : others.helperText}
      onBlur={() => state.setTouched(true)}
      onChange={(e) => {
        const textVal = e.target.value;
        setText(textVal);
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
}
