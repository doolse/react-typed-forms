import {
  notEmpty,
  RenderControl,
  useComputed,
  useControl,
  useControlEffect,
} from "@react-typed-forms/core";
import { FTextField } from "@react-typed-forms/mui";

export default function ThomasPage() {
  const myForm = useControl({ firstName: "Jolse", lastName: "maginnis" });

  useControlEffect(
    () => myForm.fields.firstName.value == "Thomas",
    (isThomas) => console.log(`It's ${isThomas}`),
    true
  );

  return (
    <div>
      <FTextField state={myForm.fields.firstName} label="First Name" />
      <FTextField state={myForm.fields.lastName} label="Last Name" />
      <RenderControl children={() => getFullName()} />
    </div>
  );

  function getFullName() {
    const v = myForm.value;
    const dirty = myForm.dirty;
    return <div>{v.firstName + " " + v.lastName + " - " + dirty}</div>;
  }
}
