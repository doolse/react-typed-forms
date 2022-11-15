import {
  getFields,
  Render,
  useComputed,
  useControl,
  useControlEffect,
} from "@react-typed-forms/core";
import { FTextField } from "@react-typed-forms/mui";

export default function ThomasPage() {
  const myForm = useControl({ firstName: "Jolse", lastName: "maginnis" });

  useControlEffect(
    () => getFields(myForm).firstName.value == "Thomas",
    (isThomas) => console.log(`It's ${isThomas}`),
    true
  );

  return (
    <div>
      <FTextField state={getFields(myForm).firstName} label="First Name" />
      <FTextField state={getFields(myForm).lastName} label="Last Name" />
      <Render children={() => getFullName()} />
    </div>
  );

  function getFullName() {
    const v = myForm.value;
    const dirty = myForm.dirty;
    return <div>{v.firstName + " " + v.lastName + " - " + dirty}</div>;
  }
}
