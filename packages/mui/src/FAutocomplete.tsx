import { Control, RenderControl } from "@react-typed-forms/core";
import { Autocomplete, AutocompleteProps, TextField } from "@mui/material";
import React, { ReactElement } from "react";

export type FAutocompleteProps<T> = {
  state: Control<string | undefined>;
  label?: string;
} & Omit<AutocompleteProps<T, false, false, true>, "renderInput">;

export function FAutocomplete(props: FAutocompleteProps<string>): ReactElement;

export function FAutocomplete<T>(
  props: FAutocompleteProps<T> & { getOptionLabel: (t: T) => string }
): ReactElement;

export function FAutocomplete({
  state,
  label,
  getOptionLabel,
  ...others
}: FAutocompleteProps<any>) {
  return (
    <RenderControl
      children={() => {
        const error = state.error;
        const value = state.value;
        return (
          <Autocomplete<any, false, false, true>
            {...others}
            freeSolo
            onChange={(event: any, newValue: any, reason) => {
              if (reason === "selectOption") {
                const newTextValue =
                  typeof newValue === "string"
                    ? newValue
                    : getOptionLabel?.(newValue) ?? newValue.toString();
                state.value = newTextValue;
              }
            }}
            inputValue={value || ""}
            onInputChange={(_, val, reason) => {
              if (reason === "input" || reason === "clear") {
                state.value = val;
              }
            }}
            getOptionLabel={getOptionLabel}
            renderInput={(p) => {
              return (
                <TextField
                  {...p}
                  label={label}
                  ref={(e) => (state.element = e)}
                  error={Boolean(error)}
                  helperText={error}
                  variant="outlined"
                />
              );
            }}
          />
        );
      }}
    />
  );
}
