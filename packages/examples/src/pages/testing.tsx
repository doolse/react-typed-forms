import {
  control,
  useFormListener,
  useFormStateVersion,
} from "@react-typed-forms/core";

export default function Doit() {
  const ok = useFormStateVersion(control<string>().createControl(""));
  return <div>Hello {ok}</div>;
}
