import { useControl, useControlEffect } from "@react-typed-forms/core";

export default function UndefinedTest() {
  const ok = useControl<{ thisExists: string; doesnt?: string }>({
    thisExists: "",
  });
  const undef = ok.fields.doesnt;
  useControlEffect(
    () => undef.value,
    (v) => {
      console.log("It happened", v);
      console.log(ok);
    },
  );
  console.log(ok.value, ok);

  return (
    <div>
      <pre>{JSON.stringify(ok.value, null, 2)}</pre>
      <button onClick={() => (ok.fields.thisExists.value = "WOW")}>
        Set original
      </button>
      <button onClick={() => (undef.value = undefined)}>
        Doesnt undefined
      </button>
      <button onClick={() => (ok.value = { thisExists: "Exists" })}>
        Reset
      </button>
      <button
        onClick={() => (ok.value = { thisExists: "Exists", doesnt: "exist" })}
      >
        Make it not undefined
      </button>
    </div>
  );
}
