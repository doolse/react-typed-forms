import { useControl } from "@react-typed-forms/core";

export function useRenderCount() {
  const renderControl = useControl<number>(0);
  renderControl.setValue((x) => (x = x + 1));
  return renderControl.current.value;
}
