"use client";
import { Control, useControl } from "@react-typed-forms/core";
import React, { useEffect } from "react";
import { ReactDispatcher } from "@react-typed-forms/core/lib/auto";

const ReactInternals = (React as any)
  .__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;

const dispatchers: any[] = [];

let currentDispatcher: ReactDispatcher | null =
  ReactInternals.ReactCurrentDispatcher.current;

export default function Page() {
  console.log(this);
  console.log(ReactInternals.ReactCurrentOwner.current, ReactInternals);
  const c = useControl(0);
  return (
    <div>
      <h1>OK {c.value}</h1>
      <button onClick={() => c.setValue((x) => x + 1)}>Add</button>{" "}
      <EnabledTest control={c} />
    </div>
  );
}

function EnabledTest({ control }: { control: Control<number> }) {
  console.log(ReactInternals.ReactCurrentOwner.current, ReactInternals);
  return (
    <>
      Enabled: {(!control.disabled).toString()}
      <button onClick={() => (control.disabled = !control.disabled)}>
        Toggle
      </button>
      <Another />
    </>
  );
}

function Another() {
  console.log(ReactInternals.ReactCurrentOwner.current, ReactInternals);
  return <h1>OK</h1>;
}
