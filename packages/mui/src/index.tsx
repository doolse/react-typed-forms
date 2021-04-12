import { TextField, TextFieldProps } from "@material-ui/core";
import React, { ReactElement, useEffect, useState } from "react";

import { useNodeStateVersion, ValueNode } from "@react-typed-forms/core";

export type FTextFieldProps = {
  state: ValueNode<string | undefined>;
} & TextFieldProps;

export function FTextField({
  state,
  ...others
}: FTextFieldProps): ReactElement {
  useNodeStateVersion(state);
  const showError = state.touched && !state.valid && Boolean(state.error);
  return (
    <TextField
      {...others}
      ref={(e) => (state.element = e)}
      value={state.value || ""}
      error={showError}
      disabled={state.disabled}
      helperText={showError ? state.error : others.helperText}
      onBlur={() => state.setTouched(true)}
      onChange={(e) => state.setValue(e.target.value)}
    />
  );
}

export type FNumberFieldProps = {
  state: ValueNode<number | null | undefined>;
  invalidError?: string | undefined;
  blankError?: string | undefined;
} & TextFieldProps;

export function FNumberField({
  state,
  invalidError,
  blankError,
  ...others
}: FNumberFieldProps): ReactElement {
  useNodeStateVersion(state);
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
