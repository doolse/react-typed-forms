import {
  ArrayControl,
  arraySelectionControl,
  buildGroup,
  ControlType,
  ControlValueTypeOut,
  FormControl,
  groupControl,
  GroupControl,
  GroupControlFields, ValueTypeForControl,
} from "@react-typed-forms/core";
import {MeasurementFormValue, MeasurementValueForm} from "../typedefs";

interface Recursive {
  id: string;
  children: Recursive[];
}

const k = buildGroup<Omit<Recursive, "children">>()({
  id: "",
  // children: arrayControl(k)
});

type WithRecursion = GroupControl<
  GroupControlFields<ControlType<typeof k>> & {
    children: ArrayControl<WithRecursion>;
  }
>;

const defWithRecursion: () => WithRecursion = () => {
  return k().addFields({
    children: new ArrayControl(defWithRecursion),
  });
};

function mustCompile() {
  const measureForm : MeasurementValueForm = undefined as any;
  const measureValue: MeasurementFormValue = undefined as any;
  measureForm.setValue(measureValue)
}

defWithRecursion().setValue({id: "", children: []});
export default function Doit() {
  return <div>Hello</div>;
}

interface TopLevel {
  one: string;
  two: boolean;
  second: SecondLevel;
}

interface SecondLevel {
  ok: string;
  wow: number;
}

const letsCheck = buildGroup<TopLevel>()({
  one: "",
  two: true,
  second: groupControl({ ok: "", wow: 1 }),
});
const howabout: GroupControl<{ one: FormControl<string> }> =
  letsCheck().subGroup(({ one }) => ({ one }));
const bal: TopLevel = letsCheck().toObject();

const ok = arraySelectionControl(
  1,
  (v) => v,
  (c) => c.value
);
