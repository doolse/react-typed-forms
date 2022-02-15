import { control, Finput, useControlValue } from "@react-typed-forms/core";
import { useState } from "react";

function UseControlValueComponent() {
  const [titleField] = useState(control(""));
  const title = useControlValue(titleField);
  return (
    <div>
      Title: <Finput state={titleField} type="text" />
      <br />
      <h1>The title is {title}</h1>
    </div>
  );
}
