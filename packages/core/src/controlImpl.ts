import {
  ChangeListener,
  Control,
  ControlChange,
  ControlFlags,
  ControlSetup,
  ControlValue,
  ElemType,
} from "./types";

enum ChildSyncFlags {
  Valid = 1,
  Dirty = 4,
  Value = 16,
  InitialValue = 32,
  ChildrenValues = 64,
  ChildrenInitialValues = 128,
}

let controlCount = 0;

const pendingChangeSet: Set<ControlImpl<any>> = new Set<ControlImpl<any>>();
let freezeCount = 0;
let runningListeners = 0;
let collectChange:
  | ((control: Control<any>, change: ControlChange) => void)
  | undefined;

export function groupedChanges<A>(change: () => A) {
  freezeCount++;
  try {
    return change();
  } finally {
    freezeCount--;
    checkChanges();
  }

  function checkChanges() {
    if (freezeCount) return;
    while (freezeCount === 0 && pendingChangeSet.size > 0) {
      const firstValue = pendingChangeSet.values().next().value;
      pendingChangeSet.delete(firstValue);
      firstValue.applyChanges(firstValue.pendingChanges);
    }
    runAfterCallbacks();
  }
}

const afterChanges: (() => void)[] = [];

export function addAfterChangesCallback(callback: () => void) {
  afterChanges.push(callback);
}

function runAfterCallbacks() {
  while (
    freezeCount === 0 &&
    pendingChangeSet.size === 0 &&
    runningListeners === 0 &&
    afterChanges.length > 0
  ) {
    afterChanges.shift()!();
  }
}

class ControlImpl<V> implements Control<V> {
  uniqueId = ++controlCount;
  _childSync: ChildSyncFlags = 0;

  public _childListener?: ChangeListener<any>;
  public listeners: ChangeListener<V>[] = [];
  public meta: { [k: string]: any };
  public _fieldsProxy?: { [k: string]: Control<any> };
  public _elems?: Control<any>[];

  pendingChanges: ControlChange = 0;

  constructor(
    public _value: V,
    public _initialValue: V,
    public _error: string | undefined,
    public flags: ControlFlags,
    public setup: ControlSetup<V, any>,
    public _fields?: { [k: string]: Control<any> },
    childSync?: ChildSyncFlags
  ) {
    this.meta = { ...setup.meta };
    if (childSync !== undefined) {
      this._childSync = childSync;
      this.runChange(0);
    }
    if (_fields)
      Object.values(_fields).forEach((x) =>
        this.attachParentListener(x as Control<any>)
      );
  }

  isEqual(a: V, b: V): boolean {
    if (this.setup.equals) return this.setup.equals(a, b);
    return a === b;
  }

  isValueEqual(v: V): boolean {
    this.checkChildSync();
    if (this._value == null) return v == null;
    if (v == null) return false;
    if (this._elems) {
      const e = this._elems;
      if (!Array.isArray(v)) return false;
      if (e.length !== v.length) return false;
      return e.every((x, i) => x.isValueEqual(v[i]));
    } else if (this._fields) {
      const f = this._fields;
      for (const k in f) {
        if (!f[k]!.isValueEqual(v[k as keyof V])) return false;
      }
      return true;
    }
    return this.isEqual(getValueInternal(this), v);
  }

  get error() {
    collectChange?.(this, ControlChange.Error);
    return this._error;
  }

  /**
   * @internal
   */
  updateError(error?: string | null): ControlChange {
    if (this._error !== error) {
      this._error = error ? error : undefined;
      this._childSync |= ChildSyncFlags.Valid;
      return ControlChange.Error;
    }
    return 0;
  }

  clearErrors(): this {
    this.updateAll((c) => c.updateError(undefined));
    return this;
  }

  lookupControl(path: (string | number)[]): Control<any> | undefined {
    let base = this as Control<any>;
    let index = 0;
    while (index < path.length && base) {
      const childId = path[index];
      if (typeof childId === "string") {
        base = getFields(base.as<Record<string, any>>())?.[childId];
      } else {
        base = getElemsInternal(base.as<any[]>())?.[childId];
      }
      index++;
    }
    return base;
  }

  get valid() {
    collectChange?.(this, ControlChange.Valid);
    return Boolean(this.flags & ControlFlags.Valid);
  }

  get dirty() {
    collectChange?.(this, ControlChange.Dirty);
    return Boolean(this.flags & ControlFlags.Dirty);
  }

  get disabled() {
    collectChange?.(this, ControlChange.Disabled);
    return Boolean(this.flags & ControlFlags.Disabled);
  }

  get touched() {
    collectChange?.(this, ControlChange.Touched);
    return Boolean(this.flags & ControlFlags.Touched);
  }

  setFlag(flag: ControlFlags, b: boolean) {
    this.flags = b ? this.flags | flag : this.flags & ~flag;
  }

  /**
   * @internal
   */
  updateValid(valid: boolean): ControlChange {
    if (isValid(this.flags) !== valid) {
      this.setFlag(ControlFlags.Valid, valid);
      return ControlChange.Valid;
    }
    return 0;
  }

  /**
   * @internal
   */
  updateDisabled(disabled: boolean): ControlChange {
    if (isDisabled(this.flags) !== disabled) {
      this.setFlag(ControlFlags.Disabled, disabled);
      return ControlChange.Disabled;
    }
    return 0;
  }

  /**
   * @internal
   */
  updateDirty(dirty: boolean): ControlChange {
    if (isDirty(this.flags) !== dirty) {
      this.setFlag(ControlFlags.Dirty, dirty);
      return ControlChange.Dirty;
    }
    return 0;
  }

  /**
   * @internal
   */
  updateTouched(touched: boolean): ControlChange {
    if (isTouched(this.flags) !== touched) {
      this.setFlag(ControlFlags.Touched, touched);
      return ControlChange.Touched;
    }
    return 0;
  }

  get childListener(): ChangeListener<any> {
    if (!this._childListener) {
      this._childListener = makeChildListener<V>(this);
    }
    return this._childListener;
  }

  /**
   * @internal
   */
  private runListeners(changed: ControlChange) {
    this.pendingChanges = 0;
    runningListeners++;
    try {
      this.listeners.forEach(([m, cb]) => {
        if ((m & changed) !== 0) cb(this, changed);
      });
    } finally {
      runningListeners--;
    }
  }

  doFieldsSync(v: V, setter: (c: Control<any>, v: any) => void) {
    const childFields = this._fields!;
    const keys = new Set<string>();
    for (const k in v) {
      const child = childFields[k];
      if (child) {
        setter(child, v[k]);
      }
      keys.add(k);
    }
    for (const k in childFields) {
      if (!keys.has(k)) {
        setter(childFields[k]!, undefined);
      }
    }
  }

  /**
   * @internal
   */
  runChange(changed: ControlChange): Control<V> {
    if (changed || this.needsChildSync) {
      if (freezeCount === 0) {
        this.applyChanges(changed);
        runAfterCallbacks();
      } else {
        this.pendingChanges |= changed;
        pendingChangeSet.add(this);
      }
    }
    return this;
  }

  syncChanges(changed: ControlChange): ControlChange {
    let childSync = this._childSync;
    if (
      childSync &
      (ChildSyncFlags.ChildrenValues | ChildSyncFlags.ChildrenInitialValues)
    ) {
      this._childSync =
        this._childSync &
        ~(ChildSyncFlags.ChildrenValues | ChildSyncFlags.ChildrenInitialValues);
      changed |= this.syncChildren(childSync);
      childSync = ChildSyncFlags.Dirty | ChildSyncFlags.Valid;
    }
    if (childSync & ChildSyncFlags.Valid) {
      changed |= this.updateValid(
        !(Boolean(this.error) || this.isAnyChildInvalid())
      );
    }
    if (childSync & ChildSyncFlags.Dirty) {
      const anyChildDirty = this.isAnyChildDirty();
      changed |= this.updateDirty(anyChildDirty);
    }
    this._childSync &= ~(ChildSyncFlags.Dirty | ChildSyncFlags.Valid);
    return changed;
  }

  syncChildren(childSync: ChildSyncFlags): ControlChange {
    if (this._elems) {
      const e = this._elems;
      const valArr =
        childSync & ChildSyncFlags.ChildrenValues
          ? (this._value as any[]) ?? []
          : (e as any[]) ?? [];
      const initialArr = (this._initialValue as any[]) ?? [];
      const newChildren = createArrayChildren(
        valArr,
        initialArr,
        (i, v, iv) => {
          if (i < e.length) {
            const existing = e[i];
            if (childSync & ChildSyncFlags.ChildrenValues) {
              existing.setValue(v);
            }
            if (childSync & ChildSyncFlags.ChildrenInitialValues) {
              existing.setInitialValue(iv);
            }
            return existing;
          } else {
            return this.attachParentListener(
              newControl(v, this.setup.elems, iv)
            );
          }
        }
      );
      this._elems = newChildren as Control<ElemType<V>>[];
      return ControlChange.Structure;
    } else if (this._fields) {
      if (childSync & ChildSyncFlags.ChildrenValues) {
        this.doFieldsSync(this._value, (x, v) => x.setValue(v, false));
      }
      if (childSync & ChildSyncFlags.ChildrenInitialValues) {
        this.doFieldsSync(this._initialValue, (x, v) => x.setInitialValue(v));
      }
    }
    return 0;
  }

  applyChanges(changed: ControlChange) {
    if (this.needsChildSync) {
      groupedChanges(() => {
        this.runChange(this.syncChanges(changed));
      });
    } else {
      this.runListeners(changed);
    }
  }

  get needsChildSync() {
    return Boolean(
      this._childSync &
        (ChildSyncFlags.Dirty |
          ChildSyncFlags.Valid |
          ChildSyncFlags.ChildrenValues |
          ChildSyncFlags.ChildrenInitialValues)
    );
  }

  groupedChanges(run: () => void): this {
    groupedChanges(run);
    return this;
  }

  addChangeListener(
    listener: (control: Control<V>, change: ControlChange) => void,
    mask?: ControlChange
  ) {
    this.listeners = [
      ...this.listeners,
      [mask ? mask : ControlChange.All, listener],
    ];
  }

  removeChangeListener(
    listener: (control: Control<V>, change: ControlChange) => void
  ) {
    this.listeners = this.listeners.filter((cl) => cl[1] !== listener);
  }

  setError(error?: string | null): Control<V> {
    return this.runChange(this.updateError(error));
  }

  /**
   * Run validation listeners.
   */
  validate(): Control<V> {
    return this.runChange(ControlChange.Validate);
  }

  attachParentListener<A>(c: Control<A>): Control<A> {
    c.addChangeListener(this.childListener[1], this.childListener[0]);
    return c;
  }

  checkChildSync() {
    const childSync =
      this._childSync &
      (ChildSyncFlags.ChildrenValues | ChildSyncFlags.ChildrenInitialValues);
    if (childSync) {
      if (!freezeCount)
        throw "BUG: children should not be out of sync while not frozen";
      this._childSync =
        this._childSync &
        ~(ChildSyncFlags.ChildrenValues | ChildSyncFlags.ChildrenInitialValues);
      this.pendingChanges |= this.syncChildren(childSync);
      this._childSync |= ChildSyncFlags.Dirty | ChildSyncFlags.Valid;
    }
  }

  set value(v: V) {
    this.setValue(v);
  }

  get value(): V {
    collectChange?.(this, ControlChange.Value);
    return getValueInternal(this);
  }

  get initialValue(): V {
    collectChange?.(this, ControlChange.InitialValue);
    return getInitialValueInternal(this);
  }

  markAsClean(): void {
    this.setValueAndInitial(this.value, this.value);
  }

  get element(): HTMLElement | null {
    return (this.meta as any)["element"];
  }

  set element(e: HTMLElement | null) {
    (this.meta as any)["element"] = e;
  }

  isAnyChildInvalid(): boolean {
    return this.getChildControls().some((x) => !isValid(x.flags));
  }

  isAnyChildDirty(): boolean {
    const e = this._elems;
    if (e) {
      const initialValues = (getInitialValueInternal(this) as any[]) ?? [];
      if (e.length !== initialValues.length) return true;
      return e.some((x, i) => !x.isValueEqual(initialValues[i]));
    } else if (this._fields) {
      return this.getChildControls().some(
        (x) => x.isAnyChildDirty() || isDirty(x.flags)
      );
    }
    return false;
  }

  get hasChildren(): boolean {
    return Boolean(this._elems || this._fields);
  }

  setInitialValue(v: V, dontTellParent?: boolean): Control<V> {
    if (this.isEqual(v, getInitialValueInternal(this))) {
      return this;
    }
    this._initialValue = v;
    const change = ControlChange.InitialValue;
    if (!this.hasChildren || v == null) {
      this._childSync &= ~ChildSyncFlags.InitialValue;
      return this.runChange(
        change | this.updateDirty(!this.isEqual(v, this._value))
      );
    }
    this._childSync =
      this._childSync |
      ((ChildSyncFlags.ChildrenInitialValues | ChildSyncFlags.Dirty) &
        ~ChildSyncFlags.InitialValue);
    return this.runChange(change);
  }

  setValueAndInitial(v: V, iv: V): Control<V> {
    groupedChanges(() => {
      this.setValue(v);
      this.setInitialValue(iv);
    });
    return this;
  }

  setValue(v: V, initial?: boolean, dontTellParent?: boolean): Control<V> {
    if (initial) {
      return this.setValueAndInitial(v, v);
    }
    if (this.isEqual(v, this.value)) {
      return this;
    }
    const structureChange =
      v == null || this._value == null ? ControlChange.Structure : 0;
    this._value = v;
    const change =
      ControlChange.Value |
      structureChange |
      (this.setup?.validator !== null
        ? this.updateError(this.setup!.validator?.(v))
        : 0);
    if (!this.hasChildren || v == null) {
      this._childSync &= ~ChildSyncFlags.Value;
      return this.runChange(
        change | this.updateDirty(!this.isEqual(v, this._initialValue))
      );
    }
    this._childSync =
      this._childSync |
      ((ChildSyncFlags.ChildrenValues | ChildSyncFlags.Dirty) &
        ~ChildSyncFlags.Value);
    return this.runChange(change);
  }

  toArray(): V {
    return this.value;
  }

  toValue(): V {
    return this.value;
  }

  /**
   * @internal
   */
  protected updateAll(change: (c: ControlImpl<any>) => ControlChange) {
    this.groupedChanges(() => {
      this.visitChildren(
        (c) => {
          c.runChange(change(c));
          return true;
        },
        true,
        true
      );
    });
  }

  visitChildren(
    visit: (c: ControlImpl<any>) => boolean,
    doSelf?: boolean,
    recurse?: boolean
  ): boolean {
    if (doSelf && !visit(this as unknown as ControlImpl<any>)) {
      return false;
    }
    const controls = this.getChildControls();
    for (const c of controls) {
      if (!visit(c)) {
        return false;
      }
      if (
        recurse &&
        !(c as ControlImpl<any>).visitChildren(visit, false, true)
      ) {
        return false;
      }
    }
    return true;
  }

  protected getChildControls(): ControlImpl<any>[] {
    return (this._elems ??
      (this._fields ? Object.values(this._fields) : [])) as ControlImpl<any>[];
  }

  /**
   * Set the disabled flag.
   * @param disabled
   */
  setDisabled(disabled: boolean): this {
    this.updateAll((c) => c.updateDisabled(disabled));
    return this;
  }

  /**
   * Set the touched flag.
   * @param touched
   */
  setTouched(touched: boolean): this {
    this.updateAll((c) => c.updateTouched(touched));
    return this;
  }

  markArrayClean(): void {}

  as<NV extends V>(): Control<NV> {
    return this as unknown as Control<NV>;
  }

  // subGroup<OUT extends { [k: string]: Control<any> }>(
  //   select: (fields: FormControlFields<V, M>) => OUT
  // ): Control<{ [K in keyof OUT]: ControlValue<OUT[K]> }> {
  //   return controlGroup(select(this.fields!)).as();
  // }

  toObject(): V {
    return this.value;
  }

  isNonNull(): this is Control<NonNullable<V>> {
    collectChange?.(this, ControlChange.Structure);
    return this._value != null;
  }

  isNull(): boolean {
    collectChange?.(this, ControlChange.Structure);
    return this._value == null;
  }
}

export type ControlDefType<T> = T extends () => Control<infer V> ? V : T;

/**
 * Define a form control containing values of type V
 * @deprecated Use useControl() instead.
 * @param value Initial value for control
 * @param validator An optional synchronous validator
 * @param equals An optional equality function
 */
export function control<V>(
  value: V,
  validator?: ((v: V) => string | undefined) | null,
  equals?: (a: V, b: V) => boolean
): () => Control<V> {
  return () => newControl(value, { validator, equals });
}

/**
 * @deprecated Use useControl() instead
 */
export function arrayControl<CHILD>(
  child: CHILD
): () => Control<(CHILD extends () => Control<infer V> ? V : CHILD)[]> {
  return () => {
    const create =
      typeof child === "function"
        ? (v: any, iv: any) => child().setValueAndInitial(v, iv)
        : undefined;
    return newControl<any[]>([], { elems: { create } });
  };
}

function initialValidation<V, M>(
  v: V,
  _setup?: ControlSetup<V, M> | (() => ControlSetup<V, M>)
): [string | undefined, boolean] {
  if (!_setup) {
    return [undefined, true];
  }
  const setup = getSetup(_setup);
  const error = setup.validator?.(v);
  if (error) {
    return [error, false];
  }
  if (Array.isArray(v) && setup.elems) {
    return [undefined, v.every((x) => initialValidation(x, setup.elems)[1])];
  }
  if (typeof v === "object" && v && setup.fields) {
    return [
      undefined,
      Object.entries(setup.fields).every(
        (x) =>
          initialValidation(v[x[0] as keyof V], x[1] as ControlSetup<any, M>)[1]
      ),
    ];
  }
  return [undefined, true];
}

function getSetup<V, M>(
  setup?: ControlSetup<V, M> | (() => ControlSetup<V, M>)
) {
  return setup ? (typeof setup === "function" ? setup() : setup) : {};
}

export function newControl<V>(
  value: V,
  setup?: ControlSetup<V, any> | (() => ControlSetup<V, any>),
  initialValue?: V
): Control<V> {
  const realSetup = getSetup(setup);
  const initial = arguments.length > 2 ? initialValue! : value;
  const builder = realSetup.create;
  if (builder) {
    return builder(value, initial, realSetup);
  }
  const [error, valid] = initialValidation(value, realSetup);
  return new ControlImpl(
    value,
    initial,
    error,
    valid ? ControlFlags.Valid : 0,
    realSetup
  );
}

/**
 * @deprecated Use useControl() instead
 * @param children
 */
export function groupControl<DEF extends { [t: string]: any }>(
  children: DEF
): () => Control<{
  [K in keyof DEF]: ControlDefType<DEF[K]>;
}> {
  return () => {
    const v = children as {
      [K in keyof DEF]: ControlDefType<DEF[K]>;
    };
    const fields = Object.entries(children)
      .filter((x) => typeof x[1] === "function")
      .map((x) => [x[0], x[1]()]);
    return new ControlImpl(
      v,
      v,
      undefined,
      ControlFlags.Valid,
      {},
      Object.fromEntries(fields),
      ChildSyncFlags.InitialValue |
        ChildSyncFlags.Value |
        ChildSyncFlags.Valid |
        ChildSyncFlags.Dirty
    );
  };
}

/**
 * @deprecated Use withElems() instead
 * Create a form group function which only accepts
 * valid definitions that will produce values of given type T.
 */
export function buildGroup<T>(): <
  DEF extends { [K in keyof T]: T[K] | (() => Control<T[K]>) }
>(
  children: DEF
) => () => Control<{
  [K in keyof T]: ControlDefType<T[K]>;
}> {
  return groupControl as any;
}

function makeChildListener<V>(pc: ControlImpl<V>): ChangeListener<any> {
  return [
    ControlChange.Value |
      ControlChange.Valid |
      ControlChange.Touched |
      ControlChange.InitialValue |
      ControlChange.Dirty |
      ControlChange.Structure,
    (child, change) => {
      let flags: ControlChange = change & ControlChange.Structure;
      if (change & ControlChange.Value) {
        flags |= ControlChange.Value;
        pc._childSync |= ChildSyncFlags.Value | ChildSyncFlags.Dirty;
      }
      if (change & ControlChange.InitialValue) {
        flags |= ControlChange.InitialValue;
        pc._childSync |= ChildSyncFlags.InitialValue | ChildSyncFlags.Dirty;
      }
      if (change & ControlChange.Valid) {
        pc._childSync |= ChildSyncFlags.Valid;
      }
      if (change & ControlChange.Dirty) {
        pc._childSync |= ChildSyncFlags.Dirty;
      }
      if (change & ControlChange.Touched) {
        flags |= pc.updateTouched(
          isTouched((child as ControlImpl<any>).flags) || isTouched(pc.flags)
        );
      }
      pc.runChange(flags);
    },
  ];
}

export function controlGroup<C extends { [k: string]: any }>(
  fields: C
): Control<{ [K in keyof C]: ControlValue<C[K]> }> {
  return new ControlImpl<{ [K in keyof C]: ControlValue<C[K]> }>(
    {} as any,
    {} as any,
    undefined,
    ControlFlags.Valid,
    {},
    fields,
    ChildSyncFlags.InitialValue |
      ChildSyncFlags.Value |
      ChildSyncFlags.Valid |
      ChildSyncFlags.Dirty
  );
}

export function notEmpty<V>(msg: string): (v: V) => string | undefined {
  return (v: V) => (!v ? msg : undefined);
}

/**
 * @deprecated Use ControlValue instead
 */
export type ControlValueTypeOut<C> = C extends Control<infer V> ? V : never;

/**
 * @deprecated Use ControlValue instead
 */
export type ValueTypeForControl<C> = ControlValue<C>;

/**
 * @deprecated Use Control instead
 */
export type GroupControl<C> = 0 extends 1 & C
  ? Control<{}>
  : Control<{
      [K in keyof C]: ControlValue<C[K]>;
    }>;

/**
 * @deprecated Use FormControl instead
 */
export type GroupControlFields<C> = C extends Control<infer V>
  ? { [K in keyof V]: Control<V[K]> }
  : never;

/**
 * @deprecated Use Control instead
 */
export type FormControl<V> = Control<V>;

export type AnyControl = Control<any>;

/**
 * @deprecated Use AnyControl instead
 */
export type BaseControl = Control<any>;

/**
 * @deprecated Use Control instead
 */
export type ControlType<T> = T extends () => Control<infer V>
  ? Control<V>
  : never;

/**
 * @deprecated Use Control instead. E.g. ArrayControl<FormControl<number> becomes Control<number[]>
 */
export type ArrayControl<C> = Control<ControlValue<C>[]>;

/**
 * @deprecated Use Control instead
 */
export type ParentControl<V> = Control<V>;

function createArrayChildren<V>(
  valArr: V[],
  iArr: V[],
  syncChild: (i: number, v: V, iv: V) => Control<V>
): Control<V>[] {
  return valArr.map((_, i) => {
    const haveValue = i < valArr.length;
    const haveInitial = i < iArr.length;
    const firstValue = haveValue ? valArr[i] : iArr[i];
    return syncChild(i, firstValue, haveInitial ? iArr[i] : firstValue);
  });
}

export function getFields<E extends { [k: string]: any }>(
  control: Control<E>
): { [K in keyof E]-?: Control<E[K]> } {
  const c = control as ControlImpl<E>;
  c._fields ??= {};
  if (!c._fieldsProxy) {
    c._fieldsProxy = new Proxy<{ [k: string]: Control<any> }>(c._fields, {
      get(
        target: { [k: string | symbol]: Control<any> },
        p: string | symbol,
        receiver: any
      ): any {
        if (p in target) {
          return target[p];
        }
        const thisInitial = getInitialValueInternal(c);
        const v = getValueInternal(c)[p as string];
        const iv = thisInitial?.[p as string];
        const newChild = newControl(v, c.setup.fields?.[p as string], iv);
        newChild.setTouched(isTouched(c.flags));
        newChild.setDisabled(isDisabled(c.flags));
        c.attachParentListener(newChild);
        target[p] = newChild;
        return newChild;
      },
    });
  }
  return c._fieldsProxy as { [K in keyof E]-?: Control<E[K]> };
}

export function getFieldValues<
  V extends { [k: string]: any },
  K extends keyof V
>(c: Control<V>, ...keys: K[]): { [NK in K]: V[NK] } {
  const fields = getFields(c);
  return Object.fromEntries(keys.map((k) => [k, fields[k].value])) as {
    [NK in K]: V[NK];
  };
}

export function getElems<V>(control: Control<V[]>): Control<V>[] {
  collectChange?.(control, ControlChange.Structure);
  return getElemsInternal(control);
}

function getElemsInternal<V>(control: Control<V[]>): Control<V>[] {
  const c = control as ControlImpl<V[]>;
  const e = c._elems;
  if (e) {
    return e;
  } else {
    const valueArr = (c._value as any) ?? [];
    const initialArr = (c._initialValue as any) ?? [];
    c._elems = createArrayChildren<any>(valueArr, initialArr, (n, i, iv) =>
      c.attachParentListener(newControl(i, c.setup.elems, iv))
    );
  }
  return c._elems;
}

export function updateElems<V extends any[]>(
  control: Control<V>,
  cb: (elems: Control<ElemType<V>>[]) => Control<ElemType<V>>[]
): void {
  const c = control as ControlImpl<V>;
  const e = getElemsInternal(control);
  const newElems = cb(e);
  if (e !== newElems) {
    ensureArrayAttachment(c, newElems, e);
    c._elems = newElems;
    c._childSync |=
      ChildSyncFlags.Value | ChildSyncFlags.Dirty | ChildSyncFlags.Valid;
    c.runChange(ControlChange.Value | ControlChange.Structure);
  }
}

function ensureArrayAttachment(
  c: ControlImpl<any>,
  newElems: Control<any>[],
  oldElems: Control<any>[]
) {
  newElems
    .filter((x) => !oldElems.includes(x))
    .forEach((x) => c.attachParentListener(x));
  oldElems
    .filter((x) => !newElems.includes(x))
    .forEach((x) => x.removeChangeListener(c.childListener[1]));
}

export function setFields<V, OTHER extends { [p: string]: any }>(
  control: Control<V>,
  fields: {
    [K in keyof OTHER]-?: Control<OTHER[K]>;
  }
): Control<V & OTHER> {
  const c = control as ControlImpl<V>;
  const exFields = c._fields ?? {};
  let changed = false;
  Object.entries(fields).forEach(([k, newField]) => {
    const exField = exFields[k];
    if (exField !== newField) {
      changed = true;
      if (exField) exField.removeChangeListener(c.childListener[1]);
      exFields[k] = newField;
      c.attachParentListener(newField);
    }
  });
  if (!changed) return c.as();

  c._childSync |=
    ChildSyncFlags.Value |
    ChildSyncFlags.InitialValue |
    ChildSyncFlags.Dirty |
    ChildSyncFlags.Valid;
  return c.runChange(ControlChange.Value | ControlChange.Structure).as();
}

export function addElement<V>(
  control: Control<V[] | undefined | null>,
  child: V,
  index?: number | Control<V>,
  insertAfter?: boolean
): Control<V> {
  if (!isControlNull(control)) {
    const c = control as ControlImpl<V[]>;
    const e = getElemsInternal(c);
    const newChild = newControl(child, c.setup.elems);
    if (typeof index === "object") {
      index = e.indexOf(index as any);
    }
    let newElems = [...e];
    if (typeof index === "number" && index < e.length) {
      newElems.splice(index + (insertAfter ? 1 : 0), 0, newChild);
    } else {
      newElems.push(newChild);
    }
    updateElems(c, () => newElems);
    return newChild;
  } else {
    control.setValue([child]);
    return getElemsInternal(control.as<V[]>())[0];
  }
}

export function removeElement<V>(
  control: Control<V[]>,
  child: number | Control<V>
): void {
  const c = getElemsInternal(control);
  const wantedIndex = typeof child === "number" ? child : c.indexOf(child);
  if (wantedIndex < 0 || wantedIndex >= c.length) return;
  updateElems(control, (ex) => ex.filter((x, i) => i !== wantedIndex));
}

export function newElement<V>(control: Control<V[]>, elem: V): Control<V> {
  return newControl(elem, (control as ControlImpl<V[]>).setup.elems);
}

function debugSync(syncFlags: ChildSyncFlags) {
  const flags: string[] = [];
  if (syncFlags & ChildSyncFlags.Value) {
    flags.push("Value");
  }
  if (syncFlags & ChildSyncFlags.Dirty) {
    flags.push("Dirty");
  }
  if (syncFlags & ChildSyncFlags.ChildrenInitialValues) {
    flags.push("ChildrenInitialValues");
  }
  if (syncFlags & ChildSyncFlags.ChildrenValues) {
    flags.push("ChildrenValues");
  }
  if (syncFlags & ChildSyncFlags.Valid) {
    flags.push("Valid");
  }
  if (syncFlags & ChildSyncFlags.InitialValue) {
    flags.push("InitialValue");
  }
  return flags.length === 0 ? "None" : flags.join("|");
}

function debugFlags(syncFlags: ControlFlags) {
  const flags: string[] = [];
  if (syncFlags & ControlFlags.Valid) {
    flags.push("Valid");
  }
  if (syncFlags & ControlFlags.Touched) {
    flags.push("Touched");
  }
  if (syncFlags & ControlFlags.Disabled) {
    flags.push("Disabled");
  }
  if (syncFlags & ControlFlags.Dirty) {
    flags.push("Dirty");
  }
  return flags.length === 0 ? "None" : flags.join("|");
}

function debugChange(syncFlags: ControlChange) {
  const flags: string[] = [];
  if (syncFlags & ControlChange.Valid) {
    flags.push("Valid");
  }
  if (syncFlags & ControlChange.Value) {
    flags.push("Value");
  }
  if (syncFlags & ControlChange.Disabled) {
    flags.push("Disabled");
  }
  if (syncFlags & ControlChange.InitialValue) {
    flags.push("InitialValue");
  }
  if (syncFlags & ControlChange.Touched) {
    flags.push("Touched");
  }
  if (syncFlags & ControlChange.Error) {
    flags.push("Error");
  }
  if (syncFlags & ControlChange.Validate) {
    flags.push("Validate");
  }
  if (syncFlags & ControlChange.Dirty) {
    flags.push("Dirty");
  }
  return flags.length === 0 ? "None" : flags.join("|");
}

export function collectChanges<V>(
  compute: () => V
): [V, (Control<any> | ControlChange)[]] {
  const controlAndChanges: (Control<any> | ControlChange)[] = [];
  const prevChange = collectChange;
  try {
    collectChange = (c, ch) => {
      const ex = controlAndChanges.indexOf(c);
      if (ex >= 0) (controlAndChanges[ex + 1] as ControlChange) |= ch;
      else controlAndChanges.push(c, ch);
    };
    const ret = compute();
    return [ret, controlAndChanges];
  } finally {
    collectChange = prevChange;
  }
}

export function trackControlChange(c: Control<any>, change: ControlChange) {
  collectChange?.(c, change);
}

function getValueInternal<V>(control: Control<V>) {
  const c = control as ControlImpl<V>;
  if (!(c._childSync & ChildSyncFlags.Value)) return c._value;

  if (c._elems) {
    c._value = c._elems.map((x) => getValueInternal(x)) as any;
  } else if (c._fields) {
    const fieldsToSync = c._fields;
    const newValue = { ...c._value };
    for (const k in fieldsToSync) {
      newValue[k as keyof V] = getValueInternal(fieldsToSync[k]!);
    }
    c._value = newValue;
  }
  c._childSync &= ~ChildSyncFlags.Value;
  return c._value;
}

function getInitialValueInternal<V>(control: Control<V>) {
  const c = control as ControlImpl<V>;
  if (!(c._childSync & ChildSyncFlags.InitialValue)) return c._initialValue;

  if (c._elems) {
    const initialValues = [...((c._initialValue as any[]) ?? [])];
    if (Array.isArray(getValueInternal(c))) {
      c._elems.forEach(
        (x, i) => (initialValues[i] = getInitialValueInternal(x))
      );
    }
    c._initialValue = initialValues as any;
  } else if (c._fields) {
    const fieldsToSync = c._fields;
    const newValue = { ...c._initialValue };
    for (const k in fieldsToSync) {
      newValue[k as keyof V] = getInitialValueInternal(fieldsToSync[k]!);
    }
    c._initialValue = newValue;
  }
  c._childSync &= ~ChildSyncFlags.InitialValue;
  return c._initialValue;
}

function isValid(flags: ControlFlags) {
  return Boolean(flags & ControlFlags.Valid);
}

function isDirty(flags: ControlFlags) {
  return Boolean(flags & ControlFlags.Dirty);
}

function isTouched(flags: ControlFlags) {
  return Boolean(flags & ControlFlags.Touched);
}

function isDisabled(flags: ControlFlags) {
  return Boolean(flags & ControlFlags.Disabled);
}

function isControlNull(c: Control<any>) {
  return (c as ControlImpl<any>)._value == null;
}
