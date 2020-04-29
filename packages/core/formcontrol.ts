import React from "react";

export type FormControlState<V, E = string> = {
  value: V;
  touched: boolean;
  dirty: boolean;
  valid: boolean;
  error?: E;
};

export type FormControlProps<V, O, E = string> = {
  name: string;
  state: FormControlState<V, E>;
  controlData: O;
  onChange(v: V): void;
  onInvalid(): void;
  onBlur(): void;
};
