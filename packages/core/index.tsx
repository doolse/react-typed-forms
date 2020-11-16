import React from "react";
import { useMemo, useState, useEffect, ReactNode } from "react";

type UndefinedProperties<T> = {
  [P in keyof T]-?: undefined extends T[P] ? P : never;
}[keyof T];

type ToOptional<T> = Partial<Pick<T, UndefinedProperties<T>>> &
  Pick<T, Exclude<keyof T, UndefinedProperties<T>>>;

export enum NodeChange {
  Value = 1,
  Valid = 2,
  Touched = 4,
  Disabled = 8,
  Error = 16,
  All = Value | Valid | Touched | Disabled | Error,
  Validate = 32,
}

export interface BaseState {
  valid: boolean;
  error: string | undefined;
  touched: boolean;
  disabled: boolean;
}

type ChangeListener<C extends BaseControl> = [
  NodeChange,
  (control: C, cb: NodeChange) => void
];

export interface BaseControl extends BaseState {
  type: string;
  listeners: ChangeListener<any>[];
  freezeCount: number;
  frozenChanges: NodeChange;
  setValue(v: any): void;
}

type ControlValue<T> = T extends FormControl<infer V>
  ? V
  : T extends ArrayControl<infer E>
  ? ControlValue<E>[]
  : T extends GroupControl<infer F>
  ? ToOptional<{ [K in keyof F]: ControlValue<F[K]> }>
  : never;

export interface FormControl<V> extends BaseControl {
  type: "prim";
  value: V;
  setValue(v: V): void;
}

export type FormFields<R> = { [K in keyof R]-?: FormControl<R[K]> };

export type GroupControlFields<R> = GroupControl<FormFields<R>>;

export interface ArrayControl<FIELD extends BaseControl> extends BaseControl {
  type: "array";
  elems: FIELD[];
  setValue(v: ControlValue<FIELD>[]): void;
  toArray(): ControlValue<FIELD>[];
  childDefinition: any;
}

export interface GroupControl<FIELDS> extends BaseControl {
  type: "group";
  fields: FIELDS;
  setValue(
    value: ToOptional<{ [K in keyof FIELDS]: ControlValue<FIELDS[K]> }>
  ): void;
  toObject(): { [K in keyof FIELDS]: ControlValue<FIELDS[K]> };
  childrenDefinition: { [K in keyof FIELDS]: any };
}

type ControlType<T> = T extends ControlDef<infer V>
  ? FormControl<V>
  : T extends ArrayDef<infer E>
  ? ArrayControl<ControlType<E>>
  : T extends GroupDef<infer F>
  ? GroupControl<
      {
        [K in keyof F]: ControlType<F[K]>;
      }
    >
  : never;

interface ControlDef<V> {
  createControl: (V: V) => FormControl<V>;
}

interface ArrayDef<ELEM> {
  createArray: (
    v: ControlValue<ControlType<ELEM>>
  ) => ArrayControl<ControlType<ELEM>>;
}

type GroupControls<DEF> = {
  [K in keyof DEF]: ControlType<DEF[K]>;
};

type GroupValues<DEF> = {
  [K in keyof DEF]: ControlValue<ControlType<DEF[K]>>;
};

interface GroupDef<FIELDS extends object> {
  createGroup(
    value: ToOptional<GroupValues<FIELDS>>
  ): GroupControl<GroupControls<FIELDS>>;
}

function isControl(v: BaseControl): v is FormControl<any> {
  return v.type === "prim";
}

function isArrayControl(v: BaseControl): v is ArrayControl<any> {
  return v.type === "array";
}

function isGroupControl(v: BaseControl): v is GroupControl<any> {
  return v.type === "group";
}

function toValue(ctrl: BaseControl): any {
  if (isControl(ctrl)) {
    return ctrl.value;
  }
  if (isArrayControl(ctrl)) {
    return ctrl.toArray();
  }
  if (isGroupControl(ctrl)) {
    return ctrl.toObject();
  }
}

export type AllowedDef<V> =
  | (V extends (infer X)[]
      ? ArrayDef<AllowedDef<X>>
      : V extends object
      ? GroupDef<{ [K in keyof V]-?: AllowedDef<V[K]> }>
      : never)
  | ControlDef<V>;

const baseControl = {
  disabled: false,
  error: undefined,
  touched: false,
  valid: true,
  listeners: [],
  frozenChanges: 0,
  freezeCount: 0,
};

function mkControl<V>(f: (c: BaseControl) => V): typeof baseControl & V {
  const base = { ...baseControl };
  return Object.assign(base, f(base as any));
}

function runListeners(node: BaseControl, changed: NodeChange) {
  node.frozenChanges = 0;
  node.listeners.forEach(([m, cb]) => {
    if ((m & changed) !== 0) cb(node, changed);
  });
}

function runChange(node: BaseControl, changed: NodeChange) {
  if (changed) {
    if (node.freezeCount === 0) {
      runListeners(node, changed);
    } else {
      node.frozenChanges |= changed;
    }
  }
}

function updateError(bs: BaseState, error: string | undefined): NodeChange {
  if (bs.error !== error) {
    bs.error = error;
    return NodeChange.Error | updateValid(bs, !Boolean(error));
  }
  return updateValid(bs, !Boolean(error));
}

function updateValid(bs: BaseState, valid: boolean): NodeChange {
  if (bs.valid !== valid) {
    bs.valid = valid;
    return NodeChange.Valid;
  }
  return 0;
}

function updateDisabled(bs: BaseState, disabled: boolean): NodeChange {
  if (bs.disabled !== disabled) {
    bs.disabled = disabled;
    return NodeChange.Disabled;
  }
  return 0;
}

function updateTouched(bs: BaseState, touched: boolean): NodeChange {
  if (bs.touched !== touched) {
    bs.touched = touched;
    return NodeChange.Touched;
  }
  return 0;
}

function parentListener<C extends BaseControl>(parent: C): ChangeListener<C> {
  return [
    NodeChange.Value | NodeChange.Valid | NodeChange.Touched,
    (child, change) => {
      var flags: NodeChange = change & NodeChange.Value;
      if (change & NodeChange.Valid) {
        const valid =
          child.valid && !parent.valid && visitChildren(parent, (c) => c.valid);
        flags |= updateValid(parent, valid);
      }
      if (change & NodeChange.Touched) {
        flags |= updateTouched(parent, child.touched || parent.touched);
      }
      runChange(parent, flags);
    },
  ];
}

function visitChildren(
  parent: BaseControl,
  visit: (c: BaseControl) => boolean,
  doSelf?: boolean,
  recurse?: boolean
): boolean {
  if (doSelf && !visit(parent)) {
    return false;
  }
  if (isArrayControl(parent)) {
    if (!parent.elems.every(visit)) {
      return false;
    }
    if (recurse) {
      return parent.elems.every((c) => visitChildren(c, visit, false, true));
    }
    return true;
  } else if (isGroupControl(parent)) {
    const fields = parent.fields;
    for (const k in fields) {
      if (!visit(fields[k])) {
        return false;
      }
      if (recurse) {
        if (!visitChildren(fields[k], visit, false, true)) {
          return false;
        }
      }
    }
    return true;
  }
  return true;
}

export function ctrl<V>(
  validator?: (v: V) => string | undefined
): ControlDef<V> {
  return {
    createControl(value: V) {
      const ctrl: FormControl<V> = mkControl(() => ({
        type: "prim",
        value,
        setValue: (value: V) => {
          if (value !== ctrl.value) {
            ctrl.value = value;
            runChange(ctrl, NodeChange.Value);
          }
        },
      }));
      addChangeListener(
        ctrl,
        (n, c) => {
          const error = validator?.(ctrl.value);
          runChange(n, updateError(ctrl, error));
        },
        NodeChange.Value | NodeChange.Validate
      );
      return ctrl;
    },
  };
}

export function formArray<V>(child: V): ArrayDef<V> {
  return {
    createArray(value: any) {
      const ctrl: ArrayControl<ControlType<V>> = mkControl(() => ({
        type: "array",
        elems: [],
        childDefinition: child,
        toArray: () => ctrl.elems.map((e) => toValue(e)),
        setValue: (v: any) => setArrayValue(ctrl, v),
      }));
      setArrayValue(ctrl, value);
      return ctrl;
    },
  };
}

function groupedChanges(node: BaseControl, run: () => void) {
  node.freezeCount++;
  run();
  node.freezeCount--;
  if (node.freezeCount === 0) {
    runListeners(node, node.frozenChanges);
  }
}

function controlFromDef(
  parent: BaseControl,
  cdef: any,
  value: any
): BaseControl {
  const l = parentListener(parent);
  var child = cdef.createControl
    ? cdef.createControl(value)
    : cdef.createArray
    ? cdef.createArray(value)
    : cdef.createGroup(value);
  addChangeListener(child, l[1], l[0]);
  return child;
}

export function group<V extends object>(children: V): GroupDef<V> {
  return {
    createGroup(v: GroupValues<V>) {
      const ctrl: GroupControl<GroupControls<V>> = mkControl((c) => {
        const fields: Record<string, BaseControl> = {};
        const rec = v as Record<string, any>;
        for (const k in children) {
          const cdef = children[k];
          const value = rec[k];
          fields[k] = controlFromDef(c, cdef, value);
        }
        return {
          type: "group",
          childrenDefinition: children,
          fields: fields as any,
          setValue: (v: any) => setGroupValue(ctrl, v),
          toObject: () => {
            const rec: Record<string, any> = {};
            for (const k in fields) {
              const bctrl = fields[k];
              rec[k] = toValue(bctrl);
            }
            return rec as any;
          },
        };
      });
      return ctrl;
    },
  };
}

export function formGroup<R>(): <
  V extends { [K in keyof R]-?: AllowedDef<R[K]> }
>(
  children: V
) => GroupDef<V> {
  return group;
}

export function useNodeChangeTracker(
  control: BaseControl,
  mask?: NodeChange
): number {
  const [count, setCount] = useState(0);
  useChangeListener(control, () => setCount((c) => c + 1), mask);
  return count;
}

export function addChangeListener<Node extends BaseControl>(
  control: Node,
  listener: (node: Node, change: NodeChange) => void,
  mask?: NodeChange
) {
  control.listeners = [
    ...control.listeners,
    [mask ? mask : NodeChange.All, listener],
  ];
}

export function removeChangeListener<Node extends BaseControl>(
  control: Node,
  listener: (node: Node, change: NodeChange) => void
) {
  control.listeners = control.listeners.filter((cl) => cl[1] !== listener);
}

export function useFormState<FIELDS extends object>(
  group: GroupDef<FIELDS>,
  value: ToOptional<GroupValues<FIELDS>>
): GroupControl<GroupControls<FIELDS>> {
  return useMemo(() => {
    return group.createGroup(value);
  }, [group]);
}

export function FormArray<V extends BaseControl>({
  state,
  children,
}: {
  state: ArrayControl<V>;
  children: (elems: V[]) => ReactNode;
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
    return () => removeChangeListener(state, updater);
  }, [state]);
  return <>{children(state.elems)}</>;
}

function updateAll(node: BaseControl, change: (c: BaseControl) => NodeChange) {
  visitChildren(
    node,
    (c) => {
      runChange(c, change(c));
      return true;
    },
    true,
    true
  );
}

function setArrayValue<C extends ArrayControl<any>>(
  ctrl: C,
  value: ControlValue<C>
) {
  groupedChanges(ctrl, () => {
    var flags: NodeChange = 0;
    const childElems = ctrl.elems;
    if (childElems.length !== value.length) {
      flags |= NodeChange.Value;
    }
    value.map((v, i) => {
      if (childElems.length <= i) {
        const newControl = controlFromDef(ctrl, ctrl.childDefinition, v);
        childElems.push(newControl);
      } else {
        childElems[i].setValue(v);
      }
    });
    const targetLength = value.length;
    const actualLength = childElems.length;
    if (targetLength !== actualLength) {
      childElems.splice(targetLength, actualLength - targetLength);
    }
    runChange(ctrl, flags);
  });
}

function setGroupValue<C extends GroupControl<any>>(
  ctrl: C,
  value: ControlValue<C>
) {
  groupedChanges(ctrl, () => {
    const fields = ctrl.fields;
    for (const k in fields) {
      fields[k].setValue(value[k]);
    }
  });
}

export function setDisabled(node: BaseControl, disabled: boolean) {
  updateAll(node, (c) => updateDisabled(c, disabled));
}

export function setTouched(node: BaseControl, touched: boolean) {
  updateAll(node, (c) => updateTouched(c, touched));
}

export function validate(node: BaseControl) {
  updateAll(node, () => NodeChange.Validate);
}

export function clearErrors(node: BaseControl) {
  updateAll(node, (c) => updateError(c, undefined));
}

export function setError(node: BaseControl, error: string | undefined) {
  runChange(node, updateError(node, error));
}

export function addFormElement<C extends BaseControl>(
  arrayControl: ArrayControl<C>,
  value: ControlValue<C>
): C {
  const newCtrl = controlFromDef(
    arrayControl,
    arrayControl.childDefinition,
    value
  ) as C;
  arrayControl.elems = [...arrayControl.elems, newCtrl];
  runChange(arrayControl, NodeChange.Value);
  return newCtrl;
}

export function removeFormElement(
  arrayControl: ArrayControl<any>,
  index: number
): void {
  arrayControl.elems = arrayControl.elems.filter((e, i) => i !== index);
  runChange(arrayControl, NodeChange.Value);
}

export function lookupControl(
  base: BaseControl,
  path: (string | number)[]
): BaseControl | null {
  var index = 0;
  while (index < path.length && base) {
    const childId = path[index];
    if (isGroupControl(base)) {
      base = base.fields[childId];
    } else if (isArrayControl(base) && typeof childId == "number") {
      base = base.elems[childId];
    } else {
      return null;
    }
    index++;
  }
  return base;
}

export function useChangeListener<Node extends BaseControl>(
  control: Node,
  listener: (node: Node, change: NodeChange) => void,
  mask?: NodeChange
) {
  const updater = useMemo(() => listener, []);
  useEffect(() => {
    addChangeListener(control, updater, mask);
    return () => removeChangeListener(control, updater);
  }, [control]);
}
