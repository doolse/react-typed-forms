import { Finput, useControl, useValue } from "@react-typed-forms/core";

function UseControlValueComponent() {
  const titleField = useControl("");
  const title = useValue(() => titleField.value);
  return (
    <div>
      Title: <Finput state={titleField} type="text" />
      <br />
      <h1>The title is {title}</h1>
    </div>
  );
}
