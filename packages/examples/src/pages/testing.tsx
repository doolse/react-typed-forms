import {ArrayControl, arrayControl, buildGroup, GroupControl, GroupControlFields} from "@react-typed-forms/core";

interface Recursive
{
  id: string;
  children: Recursive[];
}

const k = buildGroup<Omit<Recursive, "children">>()({
  id: "",
  // children: arrayControl(k)
})

type WithRecursion = GroupControl<GroupControlFields<typeof k> & {children: ArrayControl<WithRecursion>}>

const defWithRecursion: () => WithRecursion = () => {
  return k()
      .addFields({children: new ArrayControl<WithRecursion>(defWithRecursion)}) as WithRecursion;
}



export default function Doit() {
  return <div>Hello</div>;
}
