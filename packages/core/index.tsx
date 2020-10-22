import React, { ReactNode, useState, useEffect, useMemo } from "react";
import deepEqual from "deep-equal";

export enum NodeChange {
  Value = 1,
  Valid = 2,
  Touched = 4,
  Disabled = 8,
  Error = 16,
  ForceValue = 32,
}

export type ArrayErrors<X> =
  | { self: string; children: Errors<X>[] }
  | Errors<X>[];

export type GroupErrors<V> =
  | [string, { [K in keyof V]?: Errors<V[K]> }]
  | { [K in keyof V]?: Errors<V[K]> };

export type Errors<V> = V extends (infer X)[]
  ? ArrayErrors<X>
  : V extends GroupType
  ? GroupErrors<V>
  : string | undefined;

export type Validator<V> = (value: V) => Errors<V>;

export type ChangeListener = (node: BaseNode<any>, change: NodeChange) => void;

type GroupType = { [id: string]: any };

export type FormDefinition<V> = V extends (infer X)[]
  ? ArrayField<X>
  : V extends GroupType
  ? GroupField<V>
  : PrimitiveField<V>;

export type GroupDefinition<V> = { [K in keyof V]-?: FormDefinition<V[K]> };

export type PrimitiveField<V> = null | Validator<V>;

export type ArrayField<X> = {
  child: FormDefinition<X>;
  validator?: Validator<X[]>;
};

export type GroupField<V> = {
  children: GroupDefinition<V> | undefined;
  validator?: Validator<V>;
};

type ControlType = PrimitiveField<any> | ArrayField<any> | GroupField<any>;

export interface BaseState<V> {
  value: V;
  valid: boolean;
  error: string | undefined;
  touched: boolean;
  disabled: boolean;
}

export interface BaseNode<V> extends BaseState<V> {
  type: string;
  freezeCount: number;
  frozenChanges: NodeChange;
  parentData?: any;
  changeListeners: ChangeListener[];
}

export type AnyState = PrimitiveNode<any> | GroupNode<any> | ArrayNode<any>;

export interface PrimitiveNode<V> extends BaseNode<V> {
  type: "prim";
}

export type ControlState<V> = V extends (infer X)[]
  ? ArrayNode<X>
  : V extends GroupType
  ? GroupNode<V>
  : PrimitiveNode<V>;

export interface GroupNode<V extends GroupType> extends BaseNode<V> {
  type: "group";
  definition: GroupDefinition<V>;
  fields: { [K in keyof V]-?: ControlState<V[K]> };
}

export interface ArrayNode<X> extends BaseNode<X[]> {
  type: "array";
  definition: FormDefinition<X>;
  elems: ControlState<X>[];
}

function controlForType(
  c: ControlType,
  value: any,
  changeListeners: ChangeListener[],
  parentData?: any
): BaseNode<any> {
  const base: BaseNode<any> = {
    type: "prim",
    changeListeners,
    valid: true,
    touched: false,
    disabled: false,
    error: undefined,
    freezeCount: 0,
    frozenChanges: 0,
    parentData,
    value,
  };
  if (!c) {
    return base;
  }
  if (typeof c === "function") {
    addValidator(base, c);
    return base;
  } else if ("child" in c) {
    if (c.validator) {
      addValidator(base, c.validator);
    }
    const childListener = childChanged(base);
    const elems = (value as any[]).map((cv) =>
      controlForType(c.child, cv, [childListener])
    );
    return Object.assign(base, {
      type: "array",
      elems,
      definition: c.child,
    }) as ArrayNode<any>;
  }
  if ("children" in c) {
    if (c.validator) {
      addValidator(base, c.validator);
    }
    const groupChildChanged = childChanged(base);
    const fields: { [k: string]: ControlState<any> } = {};
    const childDefs = c.children;
    for (const k in childDefs) {
      const formDef = childDefs[k] as ControlType;
      const childNode = controlForType(
        formDef,
        value[k],
        [groupChildChanged],
        k
      ) as ControlState<any>;
      fields[k] = childNode;
    }
    return Object.assign(base, {
      type: "group",
      fields,
      definition: c.children,
    }) as GroupNode<any>;
  }
  throw new Error("Not a control");
}

function runListeners(node: BaseNode<any>, changed: NodeChange) {
  node.frozenChanges = 0;
  node.changeListeners.forEach((c) => c(node, changed));
}

function runChange(node: BaseNode<any>, changed: NodeChange) {
  if (node.freezeCount === 0) {
    runListeners(node, changed);
  } else {
    node.frozenChanges |= changed;
  }
}

export function setValue<V>(node: BaseNode<V>, value: V) {
  setAnyValue(node as AnyState, value);
}

function setAnyValue(node: AnyState, value: any) {
  switch (node.type) {
    case "group":
      setNodeValue(node, value);
      break;
    case "array":
      setArrayValue(node, value);
      break;
    case "prim":
      updateNode(node, { value });
  }
}

function updateNode(node: BaseNode<any>, changes: Partial<BaseState<any>>) {
  let changeFlags: NodeChange = 0;
  if ("value" in changes && !deepEqual(node.value, changes.value)) {
    node.value = changes.value;
    changeFlags |= NodeChange.Value;
  }
  if ("error" in changes && node.error !== changes.error) {
    node.error = changes.error;
    changeFlags |= NodeChange.Error;
  }
  if ("valid" in changes && node.valid !== changes.valid) {
    node.valid = changes.valid!;
    changeFlags |= NodeChange.Valid;
  }
  if ("touched" in changes && node.touched !== changes.touched) {
    node.touched = changes.touched!;
    changeFlags |= NodeChange.Touched;
  }
  if ("disabled" in changes && node.disabled !== changes.disabled) {
    node.disabled = changes.disabled!;
    changeFlags |= NodeChange.Disabled;
  }
  runChange(node, changeFlags);
}

function groupedChanges(node: BaseNode<any>, run: () => void) {
  node.freezeCount++;
  run();
  node.freezeCount--;
  if (node.freezeCount === 0) {
    runListeners(node, node.frozenChanges);
  }
}

function allChildrenValid(node: AnyState): boolean {
  if (node.type == "array") {
    return node.elems.every((bn) => bn.valid);
  }
  if (node.type == "group") {
    for (const k in node.fields) {
      if (!node.fields[k].valid) {
        return false;
      }
    }
  }
  return true;
}

function setNodeValue(node: GroupNode<any>, value: any) {
  groupedChanges(node, () => {
    const fields = node.fields;
    for (const k in fields) {
      setAnyValue(fields[k] as AnyState, value[k]);
    }
  });
}

function setArrayValue(node: ArrayNode<any>, value: any[]) {
  let arrayElemChanged = childChanged(node);
  groupedChanges(node, () => {
    if (node.elems.length !== value.length) {
      runChange(node, NodeChange.Value | NodeChange.ForceValue);
    }
    const childElems = node.elems as BaseNode<any>[];
    value.map((v, i) => {
      if (childElems.length <= i) {
        const newControl = controlForType(
          node.definition,
          v,
          [arrayElemChanged],
          i
        );
        childElems.push(newControl);
        node.value[i] = v;
      }
    });
    const targetLength = value.length;
    const actualLength = childElems.length;
    if (targetLength !== actualLength) {
      childElems.splice(targetLength, actualLength - targetLength);
      node.value.splice(targetLength, actualLength - targetLength);
    }
    updateNode(node, { valid: allChildrenValid(node) });
  });
}

function childChanged(base: BaseNode<any>): ChangeListener {
  return (node, change) => {
    if (change & NodeChange.Value) {
      const groupChildValue = base.value[node.parentData];
      if (
        change & NodeChange.ForceValue ||
        !deepEqual(groupChildValue, node.value)
      ) {
        base.value[node.parentData] = node.value;
        runChange(base, NodeChange.Value | NodeChange.ForceValue);
      }
    }
    if (change & NodeChange.Valid) {
      if (node.valid !== base.valid) {
        updateNode(base, {
          valid: base.valid ? false : allChildrenValid(base as AnyState),
        });
      }
    }
  };
}

export function addValidator<V>(
  state: BaseNode<V>,
  validate: (value: V) => Errors<V>
) {
  addChangeListener(state, (node, change) => {
    if (change & NodeChange.Value) {
      setErrors(node as ControlState<V>, validate(node.value));
    }
  });
}

export function addChangeListener(state: BaseNode<any>, f: ChangeListener) {
  state.changeListeners = [...state.changeListeners, f];
}

export function removeChangeListener(state: BaseNode<any>, f: ChangeListener) {
  state.changeListeners = state.changeListeners.filter((c) => c !== f);
}

function setArrayErrors(nodes: ControlState<any>[], errors: Errors<any>[]) {
  nodes.forEach((n, i) => {
    if (i < errors.length) {
      setErrors<any>(n, errors[i]);
    }
  });
}

function setGroupErrors(
  nodes: { [k: string]: ControlState<any> },
  errors: { [k: string]: Errors<any> }
) {
  for (const k in nodes) {
    const node = nodes[k];
    setErrors(node, errors[k]);
  }
}

function setSelfError(node: BaseNode<any>, error: string | undefined) {
  updateNode(node, { error, valid: !Boolean(error) });
}

function deepUpdate(node: AnyState, update: Partial<BaseState<any>>) {
  groupedChanges(node, () => {
    updateNode(node, update);
    switch (node.type) {
      case "array":
        node.elems.forEach((n) => deepUpdate(n, update));
        break;
      case "group":
        const fields = node.fields;
        for (const k in fields) {
          deepUpdate(fields[k], update);
        }
    }
  });
}

export function setDisabled(node: BaseNode<any>, disabled: boolean) {
  deepUpdate(node as AnyState, { disabled });
}

export function setErrors<V>(node: ControlState<V>, errors: Errors<V>) {
  if (node.type === "array") {
    const arrState = node as ArrayNode<any>;
    const arrErrs = errors as ArrayErrors<any>;
    if (!Array.isArray(arrErrs)) {
      setSelfError(node, arrErrs.self);
      setArrayErrors(arrState.elems, arrErrs.children);
    } else {
      setSelfError(node, undefined);
      setArrayErrors(arrState.elems, arrErrs);
    }
  } else if (node.type === "group") {
    const grpState = node as GroupNode<any>;
    const grpErrs = errors as GroupErrors<any>;
    if (Array.isArray(grpErrs)) {
      setSelfError(node, grpErrs[0]);
      setGroupErrors(grpState.fields, grpErrs[1]);
    } else {
      setSelfError(node, undefined);
      setGroupErrors(grpState.fields, grpErrs);
    }
  } else {
    setSelfError(node, errors as string);
  }
}

export function FormArray<V>({
  state,
  children,
}: {
  state: ArrayNode<V>;
  children: (state: ArrayNode<V>) => ReactNode;
}) {
  const [_, setChildCount] = useState(state.elems.length);
  const updater = useMemo(
    () => () => {
      setChildCount(state.elems.length);
    },
    [state]
  );
  useEffect(() => {
    addChangeListener(state, updater);
    return () => {
      removeChangeListener(state, updater);
    };
  }, [state]);
  return <>{children(state)}</>;
}

export function useFormState<V>(
  group: GroupField<V>,
  initialValue: V
): GroupNode<V> {
  return useMemo(() => {
    const formState = controlForType(group, initialValue, []) as GroupNode<V>;
    return formState;
  }, [group]);
}

export function useNodeChangeTracker(node: BaseNode<any>) {
  const [_, setCount] = useState(0);
  const updater = useMemo(
    () => () => {
      setCount((c) => c + 1);
    },
    []
  );
  useEffect(() => {
    addChangeListener(node, updater);
    return () => {
      removeChangeListener(node, updater);
    };
  }, [node]);
}

export function formGroup<V>(
  children: GroupDefinition<V>,
  validator?: Validator<V>
): GroupField<V> {
  return { children, validator };
}

export function customField<V>(validator?: Validator<V>): GroupField<V> {
  return { validator, children: undefined };
}

export function formArray<X>(
  child: FormDefinition<X>,
  validator?: Validator<X[]>
): ArrayField<X> {
  return { child, validator };
}
