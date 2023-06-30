import { Control, Finput } from "@react-typed-forms/core";
import React from "react";

export function Child({ control }: { control: Control<string> }) {
  return <Finput control={control} />;
}
