import { FDateField, FTextField } from "@react-typed-forms/mui";
import Button, { ButtonProps } from "@mui/material/Button";
import React from "react";
import {
  ActionRendererRegistration,
  DataRendererRegistration,
  DataRenderType,
  FieldType,
} from "@react-typed-forms/schemas";

export function muiTextfieldRenderer(
  variant?: "standard" | "outlined" | "filled",
): DataRendererRegistration {
  return {
    type: "data",
    schemaType: FieldType.String,
    renderType: DataRenderType.Standard,
    render: ({ control, required, id }) => {
      return (lc) => ({
        ...lc,
        label: undefined,
        children: (
          <FTextField
            id={id}
            variant={variant}
            required={required}
            fullWidth
            label={lc.label?.label}
            size="small"
            state={control}
          />
        ),
      });
    },
  };
}
export function muiActionRenderer(
  variant: ButtonProps["variant"] = "contained",
): ActionRendererRegistration {
  return {
    type: "action",
    render: (p) => (
      <Button variant={variant} onClick={p.onClick}>
        {p.actionText}
      </Button>
    ),
  };
}

export function muiDateRenderer(
  variant?: "standard" | "outlined" | "filled",
): DataRendererRegistration {
  return {
    type: "data",
    schemaType: FieldType.Date,
    render: ({ control, required, id }) => {
      return (lc) => ({
        ...lc,
        label: undefined,
        children: (
          <FDateField
            id={id}
            variant={variant}
            required={required}
            fullWidth
            label={lc.label?.label}
            size="small"
            state={control}
          />
        ),
      });
    },
  };
}
