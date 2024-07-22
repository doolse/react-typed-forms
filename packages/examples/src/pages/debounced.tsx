import {
  Finput,
  useControl,
  useValueChangeEffect,
} from "@react-typed-forms/core";

export default function Debounced() {
  const data = useControl<string>("");
  const debouncedValue = useControl(data.current.value);
  useValueChangeEffect(data, (v) => (debouncedValue.value = v), 1000);
  return (
    <div>
      <Finput control={data} />
      <Finput control={debouncedValue} />
    </div>
  );
}
