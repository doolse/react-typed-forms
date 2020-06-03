import {
  TextField,
  TextFieldProps,
  FormControlLabel,
  Checkbox,
  CheckboxProps,
} from "@material-ui/core";
import React from "react";
import {
  FieldRenderer,
  FieldPropsRenderer,
  mkFieldRenderer,
} from "@react-typed-form/core";
import {
  DatePickerProps,
  DatePicker,
  KeyboardDatePickerProps,
  KeyboardDatePicker,
} from "@material-ui/pickers";
import { FormControlProps } from "@react-typed-form/core";
import { MaterialUiPickersDate } from "@material-ui/pickers/typings/date";

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
  string | number | undefined,
  MUIFormControl &
    Pick<
      TextFieldProps,
      | "variant"
      | "name"
      | "value"
      | "error"
      | "helperText"
      | "onBlur"
      | "onChange"
    >
> = ({ state, onBlur, onChange, controlData, name }) => {
  const { touched, error, value = "" } = state;
  return {
    variant: "outlined",
    name,
    value: value !== undefined ? value : "",
    ...controlData,
    onBlur: () => onBlur(),
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
    },
    error: touched && Boolean(error),
    helperText: touched && error,
  };
};

export const muiFieldRenderer: FieldRenderer<
  MUIFormControl,
  string,
  string | number | undefined,
  TextFieldProps
> = (cp) => (op) => <TextField {...muiFieldProps(cp)} {...op} />;

export const muiDateProps: FieldPropsRenderer<
  MUIFormControl,
  string,
  MaterialUiPickersDate | null,
  {
    value: MaterialUiPickersDate;
    onChange: (d: MaterialUiPickersDate) => void;
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
  MaterialUiPickersDate | null,
  Omit<DatePickerProps, "value" | "onChange">
> = (cp) => (op) => <DatePicker {...muiDateProps(cp)} {...op} />;

export const muiKeyboardDateField: FieldRenderer<
  MUIFormControl,
  string,
  MaterialUiPickersDate | null,
  Omit<KeyboardDatePickerProps, "value" | "onChange">
> = (cp) => (op) => <KeyboardDatePicker {...muiDateProps(cp)} {...op} />;

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
