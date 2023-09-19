import { Control, RenderForm } from "@react-typed-forms/core";
import { MenuItem, TextField, TextFieldProps } from "@mui/material";
import React, { ReactNode } from "react";

export interface MultiSelectOption<V = any> {
  value: V;
  name: string;
}

export type FMultiSelectProps<V extends string | number> = {
  state: Control<V[] | undefined | null>;
  options: MultiSelectOption[];
  renderItem?: (name: string, selected: boolean) => ReactNode;
} & Omit<TextFieldProps, "onChange" | "children" | "select">;

export function FMultiSelect<V extends string | number>({
  state,
  helperText,
  options,
  defaultValue,
  renderItem,
  ...props
}: FMultiSelectProps<V>) {
  return (
    <RenderForm
      control={state}
      children={({ ref, errorText, value, ...formProps }) => (
        <TextField
          inputRef={ref}
          {...formProps}
          {...props}
          value={typeof value === "undefined" ? [] : value}
          select
          error={Boolean(errorText)}
          helperText={errorText ?? helperText}
          SelectProps={{
            displayEmpty: true,
            multiple: true,
            renderValue: (values) => {
              if (values === "") {
                return "";
              }
              const allValues = values as V[];
              return allValues
                .map(
                  (v) =>
                    options.find((x) => x.value === v)?.name ??
                    `<unknown : ${v}>`
                )
                .join(", ");
            },
          }}
          InputLabelProps={{ shrink: true }}
        >
          {options.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {renderItem?.(
                option.name,
                (value ?? []).includes(option.value)
              ) ?? option.name}
            </MenuItem>
          ))}
        </TextField>
      )}
    />
  );
}
