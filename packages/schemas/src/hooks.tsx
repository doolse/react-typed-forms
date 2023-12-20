import {
  ActionControlDefinition,
  ControlDefinition,
  ControlDefinitionType,
  DataControlDefinition,
  DataRenderType,
  DynamicPropertyType,
  EntityExpression,
  ExpressionType,
  FieldOption,
  FieldValueExpression,
  GroupedControlsDefinition,
  JsonataExpression,
  SchemaField,
} from "./types";
import {
  ActionRendererProps,
  ArrayRendererProps,
  controlForField,
  controlTitle,
  DataRendererProps,
  elementValueForField,
  ExpressionHook,
  fieldForControl,
  findCompoundField,
  findField,
  FormEditHooks,
  FormEditState,
  GroupRendererProps,
  isGroupControl,
  isScalarField,
  renderControl,
  Visibility,
} from "./controlRender";
import React, {
  Fragment,
  ReactElement,
  useEffect,
  useMemo,
  useRef,
} from "react";
import {
  addElement,
  Control,
  ControlChange,
  newControl,
  removeElement,
  trackControlChange,
  useControlEffect,
} from "@react-typed-forms/core";
import jsonata from "jsonata";

export function useDefaultValue(
  definition: DataControlDefinition,
  field: SchemaField,
  formState: FormEditState,
  useExpression: ExpressionHook,
) {
  const valueExpression = definition.dynamic?.find(
    (x) => x.type === DynamicPropertyType.DefaultValue,
  );
  if (valueExpression) {
    return useExpression(valueExpression.expr, formState);
  }
  return field.defaultValue;
}

export function useIsControlVisible(
  definition: ControlDefinition,
  formState: FormEditState,
  useExpression: ExpressionHook,
): Visibility {
  const visibleExpression = definition.dynamic?.find(
    (x) => x.type === DynamicPropertyType.Visible,
  );
  if (visibleExpression && visibleExpression.expr) {
    return {
      value: Boolean(useExpression(visibleExpression.expr, formState)),
      canChange: true,
    };
  }
  const schemaFields = formState.fields;

  const { typeControl, compoundField } = useMemo(() => {
    const typeField = schemaFields.find(
      (x) => isScalarField(x) && x.isTypeField,
    ) as SchemaField | undefined;

    const typeControl = ((typeField &&
      formState.data.fields?.[typeField.field]) ??
      newControl(undefined)) as Control<string | undefined>;
    const compoundField =
      isGroupControl(definition) && definition.compoundField
        ? formState.data.fields[definition.compoundField]
        : undefined;
    return { typeControl, compoundField };
  }, [schemaFields, formState.data]);

  const fieldName = fieldForControl(definition);
  const onlyForTypes = (
    fieldName ? findField(schemaFields, fieldName) : undefined
  )?.onlyForTypes;
  const canChange = Boolean(compoundField || (onlyForTypes?.length ?? 0) > 0);
  const value =
    (!compoundField || compoundField.value != null) &&
    (!onlyForTypes ||
      onlyForTypes.length === 0 ||
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
  const opts = field.options ?? field.restrictions?.options;
  if (opts?.length ?? 0 > 0) {
    return opts;
  }
  return undefined;
}

export const defaultExpressionHook: ExpressionHook = (
  expr: EntityExpression,
  formState: FormEditState,
) => {
  switch (expr.type) {
    case ExpressionType.Jsonata:
      const jExpr = expr as JsonataExpression;
      const compiledExpr = useMemo(
        () => jsonata(jExpr.expression),
        [jExpr.expression],
      );
      return compiledExpr.evaluate(formState.data.value);
    case ExpressionType.FieldValue:
      const fvExpr = expr as FieldValueExpression;
      const fv = controlForField(fvExpr.field, formState).value;
      return Array.isArray(fv)
        ? fv.includes(fvExpr.value)
        : fv === fvExpr.value;
    default:
      return undefined;
  }
};

export function createFormEditHooks(
  useExpression: ExpressionHook,
): FormEditHooks {
  return {
    useExpression,
    useDataProperties(
      formState,
      definition,
      field,
      renderer,
    ): DataRendererProps {
      const visible = useIsControlVisible(definition, formState, useExpression);
      const isVisible = visible.value && !formState.invisible;
      const defaultValue = useDefaultValue(
        definition,
        field,
        formState,
        useExpression,
      );
      const scalarControl = formState.data.fields[field.field];

      useEffect(() => {
        if (!isVisible) scalarControl.value = null;
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

      useControlEffect(
        () => {
          trackControlChange(scalarControl, ControlChange.Validate);
          return [isVisible, scalarControl.value, dataProps.required];
        },
        ([visible, controlValue, required]) => {
          if (
            required &&
            visible &&
            (controlValue == null || controlValue === "")
          ) {
            scalarControl.error = "Please enter a value";
          } else scalarControl.error = null;
        },
        true,
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
          (c) => renderer.renderData({ ...dataProps, control: c }),
        ),
      };
    },
    useDisplayProperties: (fs, definition) => {
      const visible = useIsControlVisible(definition, fs, useExpression);
      return { visible, definition };
    },
    useGroupProperties: (fs, definition, hooks, renderers) => {
      const visible = useIsControlVisible(definition, fs, useExpression);
      const field = definition.compoundField
        ? findCompoundField(fs.fields, definition.compoundField)
        : undefined;
      const newFs: Omit<FormEditState, "data"> & { data: Control<any> } = {
        ...fs,
        fields: field ? field.children : fs.fields,
        data: field ? fs.data.fields[field.field] : fs.data,
        invisible: !visible.value || fs.invisible,
      };
      const groupProps = {
        visible,
        hooks,
        hideTitle: definition.groupOptions.hideTitle ?? false,
        childCount: definition.children.length,
        renderChild: (i) =>
          renderControl(definition.children[i], newFs, hooks, i),
        definition,
      } satisfies GroupRendererProps;
      if (field?.collection) {
        return {
          ...groupProps,
          array: defaultArrayRendererProps(
            newFs.data,
            field,
            definition,
            fs.readonly,
            (e) =>
              renderers.renderGroup({
                ...groupProps,
                hideTitle: true,
                renderChild: (i) =>
                  renderControl(
                    definition.children[i],
                    { ...newFs, data: e },
                    hooks,
                    i,
                  ),
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
      const visible = useIsControlVisible(definition, formState, useExpression);
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
