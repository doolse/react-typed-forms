import {
  TextField,
  TextFieldProps,
  FormControlLabel,
  Checkbox,
  CheckboxProps,
} from "@material-ui/core";
import React from "react";
import { FieldRenderer, FieldPropsRenderer } from "@react-typed-form/core";
import { DatePickerProps, DatePicker } from "@material-ui/pickers";
import { FormControlProps } from "@react-typed-form/core";

export type MUIFormControl = {
  label: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
  fullWidth?: boolean;
};

export const muiFieldProps: FieldPropsRenderer<
  MUIFormControl,
  string,
  string | undefined,
  TextFieldProps
> = ({ state, onBlur, onChange, controlData, name }) => {
  const { touched, error, value = "" } = state;
  return {
    variant: "outlined",
    name,
    value,
    ...controlData,
    onBlur: () => onBlur(),
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      onChange(e.currentTarget.value),
    error: touched && Boolean(error),
    helperText: touched && error,
  } as TextFieldProps;
};

export const muiFieldRenderer: FieldRenderer<
  MUIFormControl,
  string,
  string | undefined,
  TextFieldProps
> = (cp) => (op) => <TextField {...muiFieldProps(cp)} {...op} />;

export const muiDateProps: FieldPropsRenderer<
  MUIFormControl,
  string,
  any | null,
  {
    value: any;
    onChange: (d: any) => void;
  }
> = ({ state, onBlur, onChange, controlData }) => {
  const { touched, error, value } = state;
  return {
    value,
    onChange,
    onBlur,
    ...controlData,
    error: touched && Boolean(error),
  };
};

export const muiDateFieldRenderer: FieldRenderer<
  MUIFormControl,
  string,
  any | null,
  DatePickerProps
> = (cp) => (op) => <DatePicker {...muiDateProps(cp)} {...op} />;

export const muiCheckProps: FieldPropsRenderer<
  MUIFormControl,
  string,
  boolean,
  {
    name: string;
    checked: boolean;
    onChange: (
      event: React.ChangeEvent<HTMLInputElement>,
      checked: boolean
    ) => void;
  }
> = ({ state, onChange }) => {
  const { value } = state;
  return {
    name,
    checked: value,
    onChange: (event: React.ChangeEvent<HTMLInputElement>, checked: boolean) =>
      onChange(checked),
  };
};

export const muiCheckRenderer = (
  cp: FormControlProps<boolean, MUIFormControl, string>
) => (op: CheckboxProps) => (
  <FormControlLabel
    control={<Checkbox {...muiCheckProps(cp)} {...op} />}
    label={cp.controlData.label}
  />
);
