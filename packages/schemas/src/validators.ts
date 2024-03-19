import {
  ControlDefinition,
  DataControlDefinition,
  DateComparison,
  DateValidator,
  isDataControlDefinition,
  JsonataValidator,
  ValidatorType,
} from "./types";
import {
  Control,
  useControlEffect,
  useValidator,
  useValueChangeEffect,
} from "@react-typed-forms/core";
import { useCallback } from "react";
import { ControlGroupContext, useUpdatedRef } from "./util";
import { useJsonataExpression } from "./hooks";

export function useValidationHook(
  definition: ControlDefinition,
): (
  control: Control<any>,
  hidden: boolean,
  groupContext: ControlGroupContext,
) => void {
  const validatorTypes = isDataControlDefinition(definition)
    ? definition.validators?.map((x) => x.type) ?? []
    : null;
  const r = useUpdatedRef(definition as DataControlDefinition);
  return useCallback(
    (control, hidden, groupContext) => {
      if (!validatorTypes) return;
      const dd = r.current;

      useValueChangeEffect(control, () => control.setError("default", ""));
      useValidator(
        control,
        (v) =>
          !hidden &&
          dd.required &&
          (v == null || v === "" || (Array.isArray(v) && v.length === 0))
            ? "Please enter a value"
            : null,
        "required",
      );
      (dd.validators ?? []).forEach((x, i) => {
        switch (x.type) {
          case ValidatorType.Jsonata:
            return useJsonataValidator(
              control,
              groupContext,
              x as JsonataValidator,
              hidden,
              i,
            );
          case ValidatorType.Date:
            return useDateValidator(control, x as DateValidator, i);
        }
      });
    },
    validatorTypes ? validatorTypes : [null],
  );
}

function useJsonataValidator(
  control: Control<any>,
  context: ControlGroupContext,
  expr: JsonataValidator,
  hidden: boolean,
  i: number,
) {
  const errorMsg = useJsonataExpression(expr.expression, context.groupControl);
  useControlEffect(
    () => [hidden, errorMsg.value],
    ([hidden, msg]) => control.setError("jsonata" + i, !hidden ? msg : null),
    true,
  );
}

function useDateValidator(
  control: Control<string | null | undefined>,
  dv: DateValidator,
  i: number,
) {
  let comparisonDate: number;
  if (dv.fixedDate) {
    comparisonDate = Date.parse(dv.fixedDate);
  } else {
    const nowDate = new Date();
    comparisonDate = Date.UTC(
      nowDate.getFullYear(),
      nowDate.getMonth(),
      nowDate.getDate(),
    );
    if (dv.daysFromCurrent) {
      comparisonDate += dv.daysFromCurrent * 86400000;
    }
  }
  useValidator(
    control,
    (v) => {
      if (v) {
        const selDate = Date.parse(v);
        const notAfter = dv.comparison === DateComparison.NotAfter;
        if (notAfter ? selDate > comparisonDate : selDate < comparisonDate) {
          return `Date must not be ${notAfter ? "after" : "before"} ${new Date(
            comparisonDate,
          ).toDateString()}`;
        }
      }
      return null;
    },
    "date" + i,
  );
}
