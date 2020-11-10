import { TextField, TextFieldProps } from "@material-ui/core";
import React, { ReactElement, useEffect, useMemo, useState } from "react";

import {
  FormControl,
  useNodeChangeTracker,
  setTouched,
  setError,
} from "@react-typed-form/core";

export type FTextFieldProps = {
  state: FormControl<string | undefined>;
} & TextFieldProps;

export function FTextField({
  state,
  ...others
}: FTextFieldProps): ReactElement {
  useNodeChangeTracker(state);
  const showError = state.touched && !state.valid && Boolean(state.error);
  return (
    <TextField
      {...others}
      value={state.value || ""}
      error={showError}
      disabled={state.disabled}
      helperText={showError ? state.error : others.helperText}
      onBlur={() => setTouched(state, true)}
      onChange={(e) => state.setValue(e.currentTarget.value)}
    />
  );
}

export type FNumberFieldProps = {
  state: FormControl<number | undefined>;
  invalidError: string;
} & TextFieldProps;

export function FNumberField({
  state,
  invalidError,
  ...others
}: FNumberFieldProps): ReactElement {
  useNodeChangeTracker(state);
  const showError = state.touched && !state.valid && Boolean(state.error);
  const [text, setText] = useState(state.value ?? "");
  useEffect(() => {
    setText(state.value ?? "");
  }, [state.value]);
  return (
    <TextField
      {...others}
      value={text}
      error={showError}
      disabled={state.disabled}
      helperText={showError ? state.error : others.helperText}
      onBlur={() => setTouched(state, true)}
      onChange={(e) => {
        setText(e.currentTarget.value);
        const value = parseInt(e.currentTarget.value, 10);
        if (!isNaN(value)) {
          state.setValue(value);
        } else {
          setError(state, invalidError);
        }
      }}
    />
  );
}
