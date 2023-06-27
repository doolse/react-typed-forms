"use client";
import React, { ReactNode } from "react";
import { useControl } from "@react-typed-forms/core";

export default function DebugComponent() {
  const control = useControl("");
  return <ExternalComponent something="wow" />;
}

function ExternalComponent(props: { something: string }) {
  console.log(props);
  return (
    <div>
      {[1, 2, 3].map((x) => (
        <AnotherComponent>{x}</AnotherComponent>
      ))}
    </div>
  );
}

function AnotherComponent({ children }: { children: ReactNode }) {
  return <div>{children}</div>;
}
