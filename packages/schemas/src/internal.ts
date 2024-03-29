import { Control, useControl, useControlEffect } from "@react-typed-forms/core";

export function useCalculatedControl<V>(calculate: () => V): Control<V> {
  const c = useControl(calculate);
  useControlEffect(calculate, (v) => (c.value = v));
  return c;
}
