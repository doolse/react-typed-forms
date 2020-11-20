import { TextField, TextFieldProps } from "@material-ui/core";
import React, { ReactElement, useEffect, useMemo, useState } from "react";

import {
  FormControl,
  useFormListener,
  setTouched,
  setError,
  useFormChangeCount,
} from "@react-typed-form/core";

export type FTextFieldProps = {
  state: FormControl<string | undefined>;
} & TextFieldProps;

export function FTextField({
  state,
  ...others
}: FTextFieldProps): ReactElement {
  useFormChangeCount(state);
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
  invalidError?: string | undefined;
  blankError?: string | undefined;
  invalidValue?: number;
} & TextFieldProps;

export function FNumberField({
  state,
  invalidError,
  blankError,
  invalidValue,
  ...others
}: FNumberFieldProps): ReactElement {
  useFormChangeCount(state);
  const showError = state.touched && !state.valid && Boolean(state.error);
  const [text, setText] = useState(state.value?.toString() ?? "");
  useEffect(() => {
    if (state.value || state.value === 0) {
      setText(state.value.toString());
    }
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
        const textVal = e.currentTarget.value;
        setText(textVal);
        const value = parseInt(textVal, 10);
        if (!isNaN(value)) {
          state.setValue(value);
        } else {
          state.setValue(invalidValue);
          setError(state, textVal ? invalidError : blankError);
        }
      }}
    />
  );
}
