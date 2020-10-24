import { TextField, TextFieldProps } from "@material-ui/core";
import React, { ReactElement, useEffect, useMemo, useState } from "react";

import {
  BaseNode,
  useNodeChangeTracker,
  setTouched,
} from "@react-typed-form/core";

export function FTextField({
  state,
  ...others
}: {
  state: BaseNode<string | number | undefined>;
} & TextFieldProps): ReactElement {
  useNodeChangeTracker(state);
  const showError = state.touched && !state.valid && Boolean(state.error);
  return (
    <TextField
      {...others}
      value={state.value === undefined ? "" : state.value}
      error={showError}
      disabled={state.disabled}
      helperText={showError ? state.error : others.helperText}
      onBlur={() => setTouched(state, true)}
      onChange={(e) => state.setValue(e.currentTarget.value)}
    />
  );
}
