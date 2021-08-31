import {
  ArrayControl,
  arrayControl,
  buildGroup,
  ControlType,
  GroupControl,
  GroupControlFields
} from "@react-typed-forms/core";

interface Recursive
{
  id: string;
  children: Recursive[];
}

const k = buildGroup<Omit<Recursive, "children">>()({
  id: "",
  // children: arrayControl(k)
})

type WithRecursion = GroupControl<GroupControlFields<ControlType<typeof k>> & {children: ArrayControl<WithRecursion>}>

const defWithRecursion: () => WithRecursion = () => {
  return k()
      .addFields({children: new ArrayControl<WithRecursion>(defWithRecursion)});
}



export default function Doit() {
  return <div>Hello</div>;
}
