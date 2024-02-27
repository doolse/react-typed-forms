import { Meta } from "@storybook/react";

import { FormControlPropsValue } from "./FormControlPropsValue";
import { FormControlPropsOnChange } from "./FormControlPropsOnChange";
import { FormControlPropsOnBlur } from "./FormControlPropsOnBlur";
import { FormControlPropsDisabled } from "./FormControlPropsDisabled";

const formControlPropsDescription = `
**Run effects based when a computed value changes.**

> \`value\` - 

>\`onChange\` - 

>\`onBlur\` - 

>\`disabled\` - 

>\`errorText\` \`Optional\` - 

>\`ref\` - 
`;

const meta: Meta<{}> = {
  title: "React typed forms/formControlProps",
  component: undefined,
  parameters: {
    docs: {
      description: {
        component: formControlPropsDescription,
      },
    },
  },
};

export default meta;

export {
  FormControlPropsValue,
  FormControlPropsOnChange,
  FormControlPropsOnBlur,
  FormControlPropsDisabled,
};

// export const FormControlProps: PlainStory = {
//   render: () => {
//     const [update, setUpdate] = useState(false);
//
//     const control = useControl("123");
//
//     const { ref, value, disabled, errorText, onBlur, onChange } =
//       formControlProps(control);
//
//     // console.log(ref, value, disabled, errorText, onBlur, onChange);
//
//     useControlEffect(
//       () => control.value,
//       () => setUpdate((x) => !x),
//     );
//     console.log(control.element);
//
//     return (
//       <>
//         <input
//           ref={(r) => ref(r)}
//           value={value}
//           disabled={disabled}
//           onChange={onChange}
//         />
//       </>
//     );
//   },
// };
