import {
  RenderControl,
  trackedValue,
  useControl,
  useControlEffect,
} from "@react-typed-forms/core";

export default function TrackedValues() {
  const data = useControl<{
    thisExists: string;
    doesnt?: string;
    arr?: string[];
  }>();
  const val = trackedValue(data);
  console.log("Rendered");
  return (
    <div>
      <RenderControl>
        {() => <pre>{JSON.stringify(data.value, null, 2)}</pre>}
      </RenderControl>
      <div>
        <RenderControl>{() => val?.thisExists ?? "UNDEFINED"}</RenderControl>
      </div>
      <div>
        <RenderControl>{() => val?.doesnt ?? "UNDEFINED"}</RenderControl>
      </div>
      <div>
        <RenderControl>{() => val?.arr?.[0] ?? "UNDEFINED"}</RenderControl>
      </div>
      <button onClick={() => (data.value = { thisExists: "Exists" })}>
        Reset
      </button>
      <button
        onClick={() => (data.value = { thisExists: "ALWAYS", arr: ["sada"] })}
      >
        An array
      </button>
      <button
        onClick={() => (data.value = { thisExists: "Exists", doesnt: "exist" })}
      >
        Make it not undefined
      </button>
    </div>
  );
}
