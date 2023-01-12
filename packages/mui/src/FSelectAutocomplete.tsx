import { Control, RenderControl } from "@react-typed-forms/core";
import { TextField } from "@mui/material";
import React, { ReactElement } from "react";
import { Autocomplete, AutocompleteProps } from "@mui/material";

export type FSelectAutocompleteProps<T> = {
  query: Control<string>;
  state: Control<T | undefined>;
  label?: string;
} & Omit<AutocompleteProps<T, false, false, false>, "renderInput">;

export function FSelectAutocomplete(
  props: FSelectAutocompleteProps<string>
): ReactElement;

export function FSelectAutocomplete<T>(
  props: FSelectAutocompleteProps<T> & { getOptionLabel: (t: T) => string }
): ReactElement;

export function FSelectAutocomplete({
  state,
  query,
  label,
  getOptionLabel,
  ...others
}: FSelectAutocompleteProps<any>) {
  return (
    <RenderControl
      children={() => {
        const error = state.error;
        const queryValue = query.value;
        return (
          <Autocomplete<any, false, false, false>
            {...others}
            onChange={(event: any, newValue: any, reason) => {
              if (reason === "selectOption") {
                state.value = newValue;
                query.setValue(
                  getOptionLabel?.(newValue) ?? newValue.toString()
                );
              }
            }}
            inputValue={queryValue || ""}
            onInputChange={(_, val, reason) => {
              if (reason === "input" || reason === "clear") {
                query.value = val;
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
