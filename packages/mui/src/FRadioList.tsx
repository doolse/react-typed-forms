import { FormHelperText, FormLabel, FormControl as FC } from "@mui/material";
import { Control, genericProps, RenderForm } from "@react-typed-forms/core";
import React, { ReactNode } from "react";

export type RadioPropsFunc<A> = (value: A) => {
  checked: boolean;
  onChange: (
    event: React.ChangeEvent<HTMLInputElement>,
    checked: boolean
  ) => void;
};

interface FRadioListProps<A> {
  label: string;
  helperText?: string;
  children: (checkProps: RadioPropsFunc<A>) => ReactNode;
  state: Control<A>;
}

export function FRadioList<A extends string | number>({
  state,
  children,
  label,
  helperText,
}: FRadioListProps<A>) {
  const checkProps: RadioPropsFunc<A> = (v: A) => {
    return {
      checked: v === state.value,
      onChange: (e, c) => {
        state.value = v;
      },
    };
  };
  return (
    <RenderForm
      control={state}
      children={({ errorText }) => (
        <FC error={Boolean(errorText)}>
          <FormLabel>{label}</FormLabel>
          {children(checkProps)}
          <FormHelperText>{errorText ?? helperText}</FormHelperText>
        </FC>
      )}
    />
  );
}
