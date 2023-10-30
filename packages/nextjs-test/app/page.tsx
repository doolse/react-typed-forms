"use client";
import { useControl } from "@react-typed-forms/core";

export default function Page() {
  const c = useControl(0);
  return (
    <div>
      <h1>OK {c.value}</h1>
      <button onClick={() => c.setValue((x) => x + 1)}>Add</button>{" "}
    </div>
  );
}
