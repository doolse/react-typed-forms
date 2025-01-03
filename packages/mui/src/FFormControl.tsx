import {FormControl as MFC, FormHelperText, InputLabel} from "@mui/material";
import {Control} from "@react-typed-forms/core";
import React, {ReactNode} from "react";

export interface FFormControlProps<A> {
  label?: string;
  helperText?: string;
  state: Control<A>;
  control: (props: { id: string; ariaDescribedBy: string }) => ReactNode;
}

export function FFormControl<A>({
  label,
  state,
  helperText,
  control,
}: FFormControlProps<A>) {
  const uniqueId = state.uniqueId;
  const error = state.touched && !state.valid ? state.error : undefined;
  const id = "input_" + uniqueId;
  const textId = "helptext_" + uniqueId;
  return (
    <MFC>
      <InputLabel htmlFor={id}>{label}</InputLabel>
      {control({ id, ariaDescribedBy: textId })}
      <FormHelperText id="textId" error={Boolean(error)}>
        {error || helperText}
      </FormHelperText>
    </MFC>
  );
}
