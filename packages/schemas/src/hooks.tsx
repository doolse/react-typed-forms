import {
  ControlDefinitionType,
  GroupedControlsDefinition,
  GroupRenderType,
  SchemaField,
} from "./types";
import { useMemo } from "react";
import { addMissingControls } from "./util";

//   function useValidators(
//     formState: FormEditState,
//     isVisible: boolean | undefined,
//     control: Control<any>,
//     required: boolean,
//     definition: DataControlDefinition,
//   ) {
//     if (required)
//       useValidator(
//         control,
//         (v) =>
//           isVisible === true &&
//           (v == null || v === "" || (Array.isArray(v) && v.length === 0))
//             ? "Please enter a value"
//             : null,
//         "required",
//       );
//     useValueChangeEffect(control, () => control.setError("default", ""));
//     definition.validators?.forEach((v, i) => {
//       switch (v.type) {
//         case ValidatorType.Date:
//           processDateValidator(v as DateValidator);
//           break;
//         case ValidatorType.Jsonata:
//           const errorMsg = useExpression(
//             v satisfies EntityExpression,
//             formState,
//           );
//           useControlEffect(
//             () => [isVisible, errorMsg.value],
//             ([isVisible, msg]) =>
//               control.setError(v.type + i, isVisible ? msg : null),
//             true,
//           );
//           break;
//       }
//
//       function processDateValidator(dv: DateValidator) {
//         let comparisonDate: number;
//         if (dv.fixedDate) {
//           comparisonDate = Date.parse(dv.fixedDate);
//         } else {
//           const nowDate = new Date();
//           comparisonDate = Date.UTC(
//             nowDate.getFullYear(),
//             nowDate.getMonth(),
//             nowDate.getDate(),
//           );
//           if (dv.daysFromCurrent) {
//             comparisonDate += dv.daysFromCurrent * 86400000;
//           }
//         }
//         useValidator(
//           control,
//           (v) => {
//             if (v) {
//               const selDate = Date.parse(v);
//               const notAfter = dv.comparison === DateComparison.NotAfter;
//               if (
//                 notAfter ? selDate > comparisonDate : selDate < comparisonDate
//               ) {
//                 return `Date must not be ${
//                   notAfter ? "after" : "before"
//                 } ${new Date(comparisonDate).toDateString()}`;
//               }
//             }
//             return null;
//           },
//           "date" + i,
//         );
//       }
//     });
//   }
//   return { useExpression, useValidators };
// }

export const emptyGroupDefinition: GroupedControlsDefinition = {
  type: ControlDefinitionType.Group,
  children: [],
  groupOptions: { type: GroupRenderType.Standard, hideTitle: true },
};

export function useControlDefinitionForSchema(
  sf: SchemaField[],
  definition: GroupedControlsDefinition = emptyGroupDefinition,
): GroupedControlsDefinition {
  return useMemo<GroupedControlsDefinition>(
    () => ({
      ...definition,
      children: addMissingControls(sf, definition.children ?? []),
    }),
    [sf, definition],
  );
}
