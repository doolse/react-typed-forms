import { Finput, useControl } from "@react-typed-forms/core";

function UseControlValueComponent() {
  const titleField = useControl("");
  const title = titleField.value;
  return (
    <div>
      Title: <Finput control={titleField} type="text" />
      <br />
      <h1>The title is {title}</h1>
    </div>
  );
}
