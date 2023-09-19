import { Control, formControlProps } from "@react-typed-forms/core";
import {
  MenuItem,
  Select,
  SelectProps,
  TextField,
  TextFieldProps,
} from "@mui/material";
import React, { ReactNode } from "react";

type stringOrNumber = string | number;

export interface SelectOption {
  value: stringOrNumber;
  name: string;
}

type FSelectValue = stringOrNumber;

export type FSelectProps = {
  state: Control<FSelectValue | undefined | null>;
  options: SelectOption[];
  renderItem?: (name: string, selected: boolean) => ReactNode;
  emptyText?: string;
} & Omit<TextFieldProps, "onChange" | "children" | "select">;

export function FSelect({
  state,
  helperText,
  options,
  defaultValue,
  renderItem,
  emptyText,
  ...props
}: FSelectProps) {
  const { ref, errorText, value, ...formProps } = formControlProps(state);

  return (
    <TextField
      inputRef={ref}
      {...formProps}
      {...props}
      value={value == null ? "" : value}
      select
      error={Boolean(errorText)}
      helperText={errorText ?? helperText}
      SelectProps={{
        displayEmpty: true,
        renderValue: (values) => {
          const stringValue = values as stringOrNumber;
          if (typeof stringValue != null)
            return (
              options.find((x) => x.value === stringValue)?.name ??
              (!stringValue ? emptyText : `<unknown : ${stringValue}>`)
            );
          else return "";
        },
      }}
      InputLabelProps={{ shrink: true }}
    >
      {options.map((option) => (
        <MenuItem key={option.value} value={option.value}>
          {renderItem?.(option.name, option.value == value) ?? option.name}
        </MenuItem>
      ))}
    </TextField>
  );
}

export type FSelectOnlyProps = {
  state: Control<FSelectValue | undefined | null>;
  options: SelectOption[];
  renderItem?: (name: string, selected: boolean) => ReactNode;
} & Omit<SelectProps, "onChange" | "children" | "select">;

export function FSelectOnly({
  state,
  options,
  defaultValue,
  renderItem,
  ...props
}: FSelectOnlyProps) {
  const { ref, value, onChange, ...formProps } = formControlProps(state);
  return (
    <Select
      inputRef={ref}
      {...formProps}
      {...props}
      onChange={(e, v) => console.log({ e, v })}
      value={value == null ? "" : value}
      displayEmpty
      renderValue={(values) => {
        const stringValue = values as stringOrNumber;
        if (typeof stringValue === "string")
          return (
            options.find((x) => x.value === stringValue)?.name ??
            `<unknown : ${stringValue}>`
          );
        else return "";
      }}
    >
      {options.map((option) => (
        <MenuItem key={option.value} value={option.value}>
          {renderItem?.(option.name, option.value == value) ?? option.name}
        </MenuItem>
      ))}
    </Select>
  );
}
