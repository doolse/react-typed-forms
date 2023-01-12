import { Control, genericProps, RenderForm } from "@react-typed-forms/core";
import { FormControl as FC, FormHelperText, FormLabel } from "@mui/material";
import React, { ReactNode } from "react";

export type CheckPropsFunc<A> = (value: A) => {
  checked: boolean;
  onChange: (
    event: React.ChangeEvent<HTMLInputElement>,
    checked: boolean
  ) => void;
};

interface FCheckListProps<A> {
  label: string;
  helperText?: string;
  children: (checkProps: CheckPropsFunc<A>) => ReactNode;
  state: Control<A[]>;
  compare?: (a1: A, a2: A) => boolean;
}

export function FCheckList<A>({
  state,
  children,
  label,
  helperText,
  compare,
}: FCheckListProps<A>) {
  const comp = compare ?? ((a: A, b: A) => a === b);
  function isSelected(v: A) {
    return (
      state.value.find((a) => {
        comp(a, v);
      }) != null
    );
  }
  const checkProps: CheckPropsFunc<A> = (v: A) => {
    return {
      checked: isSelected(v),
      disabled: state.disabled,
      onChange: (e, c) => {
        const current = isSelected(v);
        if (current !== c) {
          state.setValue((x) =>
            current ? x.filter((a) => !comp(a, v)) : [...x, v]
          );
        }
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
