import {
  ActionControlDefinition,
  ControlDefinition,
  ControlDefinitionType,
  DataControlDefinition,
  DataRenderType,
  DateComparison,
  DateValidator,
  DynamicPropertyType,
  EntityExpression,
  ExpressionType,
  FieldOption,
  FieldValueExpression,
  GroupedControlsDefinition,
  GroupRenderType,
  JsonataExpression,
  SchemaField,
  SchemaValidator,
  ValidatorType,
} from "./types";
import {
  ActionRendererProps,
  ArrayRendererProps,
  controlForField,
  controlTitle,
  DataRendererProps,
  fieldForControl,
  FormEditHooks,
  FormEditState,
  GroupRendererProps,
  renderControl,
  RenderControlOptions,
  SchemaHooks,
  Visibility,
} from "./controlRender";
import React, { Fragment, ReactElement, useEffect, useMemo } from "react";
import {
  addElement,
  Control,
  ControlChange,
  newControl,
  removeElement,
  useComputed,
  useControl,
  useControlEffect,
  useValidator,
} from "@react-typed-forms/core";
import jsonata from "jsonata";
import {
  addMissingControls,
  elementValueForField,
  findCompoundField,
  findField,
  isScalarField,
} from "./util";
import { FieldType } from "./types";

export function useDefaultValue(
  definition: DataControlDefinition,
  field: SchemaField,
  formState: FormEditState,
  hooks: SchemaHooks,
) {
  const valueExpression = definition.dynamic?.find(
    (x) => x.type === DynamicPropertyType.DefaultValue,
  );
  if (valueExpression) {
    return hooks.useExpression(valueExpression.expr, formState).value;
  }
  return field.defaultValue;
}

export function useIsControlVisible(
  definition: ControlDefinition,
  formState: FormEditState,
  hooks: SchemaHooks,
): Visibility {
  const visibleExpression = definition.dynamic?.find(
    (x) => x.type === DynamicPropertyType.Visible,
  );
  if (visibleExpression && visibleExpression.expr) {
    const exprValue = hooks.useExpression(
      visibleExpression.expr,
      formState,
    ).value;
    return {
      value: exprValue,
      canChange: true,
    };
  }
  const schemaFields = formState.fields;

  const typeControl = useMemo(() => {
    const typeField = schemaFields.find(
      (x) => isScalarField(x) && x.isTypeField,
    ) as SchemaField | undefined;

    return ((typeField && formState.data.fields?.[typeField.field]) ??
      newControl(undefined)) as Control<string | undefined>;
  }, [schemaFields, formState.data]);

  const fieldName = fieldForControl(definition);
  const schemaField = fieldName
    ? findField(schemaFields, fieldName)
    : undefined;
  const isSingleCompoundField =
    schemaField &&
    schemaField.type === FieldType.Compound &&
    !schemaField.collection;
  const onlyForTypes = schemaField?.onlyForTypes ?? [];
  const canChange = Boolean(isSingleCompoundField || onlyForTypes.length);
  const value =
    (!isSingleCompoundField ||
      formState.data.fields[fieldName!].value != null) &&
    (!onlyForTypes.length ||
      Boolean(typeControl.value && onlyForTypes.includes(typeControl.value)));
  return { value, canChange };
}

export function getDefaultScalarControlProperties(
  definition: DataControlDefinition,
  field: SchemaField,
  visible: Visibility,
  defaultValue: any,
  control: Control<any>,
  formState: FormEditState,
): DataRendererProps {
  return {
    definition,
    field,
    defaultValue,
    options: getOptionsForScalarField(field),
    renderOptions: definition.renderOptions ?? {
      type: DataRenderType.Standard,
    },
    required: definition.required ?? false,
    visible,
    readonly: formState.readonly ?? definition.readonly ?? false,
    control,
    formState,
  };
}

export function getOptionsForScalarField(
  field: SchemaField,
): FieldOption[] | undefined | null {
  const opts = field.options;
  if (opts?.length ?? 0 > 0) {
    return opts;
  }
  return undefined;
}

export function createDefaultSchemaHooks(): SchemaHooks {
  function useExpression(
    expr: EntityExpression,
    formState: FormEditState,
  ): Control<any | undefined> {
    switch (expr.type) {
      case ExpressionType.Jsonata:
        const jExpr = expr as JsonataExpression;
        const compiledExpr = useMemo(
          () => jsonata(jExpr.expression),
          [jExpr.expression],
        );
        const control = useControl();
        useControlEffect(
          () => formState.data.value,
          async (v) => {
            control.value = await compiledExpr.evaluate(v);
          },
          true,
        );
        return control;
      case ExpressionType.FieldValue:
        const fvExpr = expr as FieldValueExpression;
        return useComputed(() => {
          console.log(fvExpr);
          const fv = controlForField(fvExpr.field, formState).value;
          return Array.isArray(fv)
            ? fv.includes(fvExpr.value)
            : fv === fvExpr.value;
        });
      default:
        return useControl(undefined);
    }
  }

  function useValidators(
    formState: FormEditState,
    isVisible: boolean | undefined,
    control: Control<any>,
    required: boolean,
    validators?: SchemaValidator[] | null,
  ) {
    if (required)
      useValidator(
        control,
        (v) =>
          isVisible === true && (v == null || v === "")
            ? "Please enter a value"
            : null,
        "required",
      );
    validators?.forEach((v, i) => {
      switch (v.type) {
        case ValidatorType.Date:
          processDateValidator(v as DateValidator);
          break;
        case ValidatorType.Jsonata:
          const errorMsg = useExpression(
            v satisfies EntityExpression,
            formState,
          );
          useControlEffect(
            () => [isVisible, errorMsg.value],
            ([isVisible, msg]) =>
              control.setError(v.type + i, isVisible ? msg : null),
            true,
          );
          break;
      }

      function processDateValidator(dv: DateValidator) {
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
              if (
                notAfter ? selDate > comparisonDate : selDate < comparisonDate
              ) {
                return `Date must not be ${
                  notAfter ? "after" : "before"
                } ${new Date(comparisonDate).toDateString()}`;
              }
            }
            return null;
          },
          "date" + i,
        );
      }
    });
  }
  return { useExpression, useValidators };
}

export const defaultFormEditHooks = createFormEditHooks(
  createDefaultSchemaHooks(),
);

export function createFormEditHooks(schemaHooks: SchemaHooks): FormEditHooks {
  return {
    schemaHooks,
    useDataProperties(formState, definition, field): DataRendererProps {
      const visible = useIsControlVisible(definition, formState, schemaHooks);
      const isVisible = visible.value && !formState.invisible;
      const defaultValue = useDefaultValue(
        definition,
        field,
        formState,
        schemaHooks,
      );
      const scalarControl = formState.data.fields[field.field];

      useEffect(() => {
        if (isVisible === false) scalarControl.value = null;
        else if (scalarControl.current.value == null) {
          scalarControl.value = defaultValue;
        }
      }, [isVisible, defaultValue]);

      const dataProps = getDefaultScalarControlProperties(
        definition,
        field,
        visible,
        defaultValue,
        scalarControl,
        formState,
      );

      schemaHooks.useValidators(
        formState,
        isVisible,
        scalarControl,
        dataProps.required,
        definition.validators,
      );

      useEffect(() => {
        const subscription = scalarControl.subscribe(
          (c) => (c.touched = true),
          ControlChange.Validate,
        );
        return () => scalarControl.unsubscribe(subscription);
      }, []);

      if (!field.collection) return dataProps;
      return {
        ...dataProps,
        array: defaultArrayRendererProps(
          scalarControl,
          field,
          definition,
          dataProps.readonly,
          (c) => formState.renderer.renderData({ ...dataProps, control: c }),
        ),
      };
    },
    useDisplayProperties: (fs, definition) => {
      const visible = useIsControlVisible(definition, fs, schemaHooks);
      return { visible, definition };
    },
    useGroupProperties: (fs, definition) => {
      const visible = useIsControlVisible(definition, fs, schemaHooks);
      const field = definition.compoundField
        ? findCompoundField(fs.fields, definition.compoundField)
        : undefined;
      const newFs: RenderControlOptions = {
        ...fs,
        fields: field ? field.children : fs.fields,
        invisible: visible.value === false || fs.invisible,
      };
      const data = field ? fs.data.fields[field.field] : fs.data;
      const groupProps = {
        visible,
        hooks: fs.hooks,
        hideTitle: definition.groupOptions.hideTitle ?? false,
        childCount: definition.children.length,
        renderChild: (i) =>
          renderControl(definition.children[i], data, newFs, i),
        definition,
      } satisfies GroupRendererProps;
      if (field?.collection) {
        return {
          ...groupProps,
          array: defaultArrayRendererProps(
            data,
            field,
            definition,
            fs.readonly,
            (e) =>
              fs.renderer.renderGroup({
                ...groupProps,
                hideTitle: true,
                renderChild: (i) =>
                  renderControl(definition.children[i], e, newFs, i),
              }),
          ),
        };
      }
      return groupProps;
    },
    useActionProperties(
      formState: FormEditState,
      definition: ActionControlDefinition,
    ): ActionRendererProps {
      const visible = useIsControlVisible(definition, formState, schemaHooks);
      return {
        visible,
        onClick: () => {},
        definition,
      };
    },
  };
}

function defaultArrayRendererProps(
  control: Control<any[]>,
  field: SchemaField,
  definition: DataControlDefinition | GroupedControlsDefinition,
  readonly: boolean | undefined | null,
  renderElem: (c: Control<any>) => ReactElement,
): ArrayRendererProps {
  return {
    control,
    childCount: control.elements?.length ?? 0,
    field,
    definition,
    addAction: !readonly
      ? {
          definition: {
            title: "Add " + controlTitle(definition.title, field),
            type: ControlDefinitionType.Action,
            actionId: "addElement",
          },
          visible: { value: true, canChange: false },
          onClick: () => addElement(control, elementValueForField(field)),
        }
      : undefined,
    removeAction: !readonly
      ? (i) => ({
          definition: {
            title: "Remove",
            type: ControlDefinitionType.Action,
            actionId: "removeElement",
          },
          visible: { value: true, canChange: false },
          onClick: () => removeElement(control, control.elements[i]),
        })
      : undefined,
    childKey: (i) => control.elements[i].uniqueId,
    renderChild: (i) => {
      const c = control.elements[i];
      return <Fragment key={c.uniqueId}>{renderElem(c)}</Fragment>;
    },
  };
}

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
      children: addMissingControls(sf, definition.children),
    }),
    [sf, definition],
  );
}
