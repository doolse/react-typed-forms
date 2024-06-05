import {
  getFieldLazy,
  useControl,
  useControlEffect,
} from "@react-typed-forms/core";
import { useEffect } from "react";

export default function UndefinedTest() {
  const ok = useControl<{ thisExists: string; doesnt?: string }>({
    thisExists: "",
  });
  const undef = getFieldLazy(ok, "doesnt");
  useControlEffect(
    () => undef.value,
    (v) => {
      console.log("It happened", v);
      console.log(ok);
    },
  );
  console.log(ok);

  return (
    <div>
      <pre>{JSON.stringify(ok.value, null, 2)}</pre>
      <button
        onClick={() => (ok.value = { thisExists: "Exists", doesnt: "exist" })}
      >
        Make it not undefined
      </button>
    </div>
  );
}
