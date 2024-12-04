import {
  ChangeListenerFunc,
  Control,
  ControlChange,
  ControlFlags,
  ControlProperties,
  ControlSetup,
  ControlValue,
  ElemType,
  Subscription
} from "./types";

type ParentMeta = [string | number, Subscription | undefined];
type ChangeListener = [ControlChange, ChangeListenerFunc<any>];
enum ChildSyncFlags {
  None = 0,
  Valid = 1,
  Dirty = 4,
  Value = 16,
  InitialValue = 32,
  ChildrenValues = 64,
  ChildrenInitialValues = 128,
}

const UndefinedMeta = "$_uf";

export type ValueAndDeps<V> = [V, (Control<any> | ControlChange)[]];

let controlCount = 0;

const pendingChangeSet: Set<ControlImpl<any>> = new Set<ControlImpl<any>>();
let freezeCount = 0;
let runningListeners = 0;

let nopCollectChange: ChangeListenerFunc<any> = () => {};
let collectChange = nopCollectChange;

export function unsafeFreezeCountEdit(change: number) {
  freezeCount += change;
}

export function groupedChanges<A>(change: () => A) {
  freezeCount++;
  try {
    return change();
  } finally {
    freezeCount--;
    runPendingChanges();
  }
}
export function runPendingChanges() {
  if (freezeCount) return;
  while (freezeCount === 0 && pendingChangeSet.size > 0) {
    const firstValue = pendingChangeSet.values().next().value!;
    pendingChangeSet.delete(firstValue);
    firstValue.applyChanges(firstValue.pendingChanges);
  }
  runAfterCallbacks();
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

  public _childListener?: ChangeListener;
  public listeners: ChangeListener[] = [];
  public meta: { [k: string]: any };
  public _fieldsProxy?: { [k: string]: Control<any> };
  public _elems?: Control<any>[];
  public current: ControlProperties<V>;

  pendingChanges: ControlChange = ControlChange.None;

  constructor(
    public _value: V,
    public _initialValue: V,
    public _errors: { [k: string]: string } | null,
    public flags: ControlFlags,
    public setup: ControlSetup<V, any>,
    public _fields?: { [k: string]: Control<any> },
    childSync?: ChildSyncFlags,
  ) {
    this.meta = { ...setup.meta };
    this.current = new ControlStateImpl(this);
    this.flags |= this.isEqual(_value, _initialValue) ? ControlFlags.None : ControlFlags.Dirty;
    if (childSync !== undefined) {
      this._childSync = childSync;
      this.runChange(0);
    }
    if (_fields)
      Object.entries(_fields).forEach((x) =>
        this.attachParentListener(x[1], x[0]),
      );
    setup.afterCreate?.(this);
  }

  get isNull() {
    collectChange(this, ControlChange.Structure);
    return this.current.isNull;
  }

  get fields() {
    collectChange(this, ControlChange.Structure);
    return this.current.fields;
  }

  get elements(): any {
    collectChange(this, ControlChange.Structure);
    return this.current.elements;
  }

  isEqual(a: V, b: V): boolean {
    if (a === b) return true;
    if (this.setup.equals) return this.setup.equals(a, b);
    return basicShallowEquals(a, b);
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
    return this.isEqual(this.current.value, v);
  }

  get error(): string | null | undefined {
    collectChange(this, ControlChange.Error);
    if (!this._errors) return null;
    return Object.values(this._errors)[0];
  }

  setError(key: string, error?: string | null) {
    this.runChange(this.updateError(key, error));
  }

  setErrors(errors: { [k: string]: string | null | undefined }) {
    const realErrors = Object.entries(errors).filter((x) => !!x[1]);
    const exactErrors = realErrors.length
      ? (Object.fromEntries(realErrors) as Record<string, string>)
      : null;
    if (!basicShallowEquals(exactErrors, this._errors)) {
      this._errors = exactErrors;
      this._childSync |= ChildSyncFlags.Valid;
      this.runChange(ControlChange.Error);
    }
  }

  get errors() {
    collectChange(this, ControlChange.Error);
    return this._errors ?? {};
  }

  /**
   * @internal
   */
  updateError(key: string, error?: string | null): ControlChange {
    const exE = this._errors;
    if (!error) error = null;
    if (exE?.[key] != error) {
      if (error) {
        if (exE) exE[key] = error;
        else this._errors = { [key]: error };
      } else {
        if (exE) {
          if (Object.values(exE).length === 1) this._errors = null;
          else delete exE[key];
        }
      }
      this._childSync |= ChildSyncFlags.Valid;
      return ControlChange.Error;
    }
    return 0;
  }

  clearErrors(): this {
    this.updateAll((c) => {
      if (c._errors) {
        c._errors = null;
        c._childSync |= ChildSyncFlags.Valid;
        return ControlChange.Error;
      }
      return 0;
    });
    return this;
  }

  lookupControl(path: (string | number)[]): Control<any> | undefined {
    let base = this as Control<any> | undefined;
    let index = 0;
    while (index < path.length && base) {
      const childId = path[index];
      const c = base.current;
      if (typeof childId === "string") {
        base = c.fields?.[childId];
      } else {
        base = c.elements?.[childId];
      }
      index++;
    }
    return base;
  }

  get valid() {
    collectChange(this, ControlChange.Valid);
    return Boolean(this.flags & ControlFlags.Valid);
  }

  get dirty() {
    collectChange(this, ControlChange.Dirty);
    return Boolean(this.flags & ControlFlags.Dirty);
  }

  get disabled() {
    collectChange(this, ControlChange.Disabled);
    return Boolean(this.flags & ControlFlags.Disabled);
  }

  get touched() {
    collectChange(this, ControlChange.Touched);
    return Boolean(this.flags & ControlFlags.Touched);
  }

  setFlag(flag: ControlFlags, b: boolean) {
    this.flags = b ? this.flags | flag : this.flags & ~flag;
  }

  /**
   * @internal
   */
  updateValid(valid: boolean): ControlChange {
    if (this.current.valid !== valid) {
      this.setFlag(ControlFlags.Valid, valid);
      return ControlChange.Valid;
    }
    return 0;
  }

  /**
   * @internal
   */
  updateDisabled(disabled: boolean): ControlChange {
    if (this.current.disabled !== disabled) {
      this.setFlag(ControlFlags.Disabled, disabled);
      return ControlChange.Disabled;
    }
    return 0;
  }

  /**
   * @internal
   */
  updateDirty(dirty: boolean): ControlChange {
    if (this.current.dirty !== dirty) {
      this.setFlag(ControlFlags.Dirty, dirty);
      return ControlChange.Dirty;
    }
    return 0;
  }

  /**
   * @internal
   */
  updateTouched(touched: boolean): ControlChange {
    if (this.current.touched !== touched) {
      this.setFlag(ControlFlags.Touched, touched);
      return ControlChange.Touched;
    }
    return 0;
  }

  get childListener(): ChangeListener {
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
    const prev = collectChange;
    try {
      collectChange = nopCollectChange;
      this.listeners.forEach(([m, cb]) => {
        if ((m & changed) !== 0) cb(this, changed);
      });
    } finally {
      collectChange = prev;
      runningListeners--;
    }
  }

  doFieldsSync(
    v: V,
    setter: (c: Control<any>, v: any) => void,
    undef: ChildSyncFlags,
  ) {
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
        const um = (this.meta[UndefinedMeta] ??= {});
        um[k] |= undef;
        setter(childFields[k], undefined);
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
        !(Boolean(this.current.error) || this.isAnyChildInvalid()),
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
              existing.value = v;
            }
            if (childSync & ChildSyncFlags.ChildrenInitialValues) {
              existing.initialValue = iv;
            }
            return existing;
          } else {
            return this.attachParentListener(
              newControl(v, this.setup.elems, iv),
              i,
            );
          }
        },
      );
      this._elems = newChildren as Control<ElemType<V>>[];
      return ControlChange.Structure;
    } else if (this._fields) {
      if (childSync & ChildSyncFlags.ChildrenValues) {
        this.doFieldsSync(
          this._value,
          (x, v) => (x.value = v),
          ChildSyncFlags.Value,
        );
      }
      if (childSync & ChildSyncFlags.ChildrenInitialValues) {
        this.doFieldsSync(
          this._initialValue,
          (x, v) => (x.initialValue = v),
          ChildSyncFlags.InitialValue,
        );
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
      this.runListeners(changed | this.pendingChanges);
    }
  }

  get needsChildSync() {
    return Boolean(
      this._childSync &
        (ChildSyncFlags.Dirty |
          ChildSyncFlags.Valid |
          ChildSyncFlags.ChildrenValues |
          ChildSyncFlags.ChildrenInitialValues),
    );
  }

  groupedChanges(run: () => void): this {
    groupedChanges(run);
    return this;
  }

  subscribe(
    listener: ChangeListenerFunc<V>,
    mask?: ControlChange,
  ): Subscription {
    const newListener: ChangeListener = [
      mask ? mask : ControlChange.All,
      listener,
    ];
    this.listeners = [...this.listeners, newListener];
    return newListener;
  }

  unsubscribe(listener: ChangeListenerFunc<V> | Subscription) {
    const l = Array.isArray(listener) ? listener[1] : listener;
    this.listeners = this.listeners.filter((cl) => cl[1] !== l);
  }

  set error(error: string | null | undefined) {
    this.runChange(this.updateError("default", error));
  }

  /**
   * Run validation listeners.
   */
  validate(): boolean {
    this.updateAll(() => ControlChange.Validate);
    return this.current.valid;
  }

  getParentMeta(c: Control<any>) {
    const metaId = "$_" + this.uniqueId;
    return c.meta[metaId] as ParentMeta | undefined;
  }

  ensureParentMeta(c: Control<any>, childKey: number | string): ParentMeta {
    const metaId = "$_" + this.uniqueId;
    let meta = c.meta[metaId] as ParentMeta | undefined;
    if (!meta) {
      meta = [childKey, undefined];
      c.meta[metaId] = meta;
    }
    return meta;
  }

  detachParentListener(c: Control<any>) {
    let meta = this.getParentMeta(c);
    const s = meta?.[1];
    if (s) {
      c.unsubscribe(s);
      meta![1] = undefined;
    }
  }
  attachParentListener<A>(
    c: Control<A>,
    childData: number | string,
  ): Control<A> {
    const meta = this.ensureParentMeta(c, childData);
    if (!meta[1]) {
      meta[1] = c.subscribe(this.childListener[1], this.childListener[0]);
    }
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
    if (this.isEqual(v, this.current.value)) {
      return;
    }
    const structureChange =
      v == null || this._value == null ? ControlChange.Structure : 0;
    this._value = v;
    const change =
      ControlChange.Value |
      structureChange |
      (this.setup?.validator !== null
        ? this.updateError("default", this.setup.validator?.(v))
        : 0);
    if (!this.hasChildren || v == null) {
      this._childSync &= ~ChildSyncFlags.Value;
      this.runChange(
        change | this.updateDirty(!this.isEqual(v, this._initialValue)),
      );
    } else {
      this._childSync =
        this._childSync |
        ((ChildSyncFlags.ChildrenValues | ChildSyncFlags.Dirty) &
          ~ChildSyncFlags.Value);
      this.runChange(change);
    }
  }

  get value(): V {
    collectChange(this, ControlChange.Value);
    return this.current.value;
  }

  get initialValue(): V {
    collectChange(this, ControlChange.InitialValue);
    return this.current.initialValue;
  }

  markAsClean(): void {
    this.setValueAndInitial(this.current.value, this.current.value);
  }

  get element(): HTMLElement | null {
    return (this.meta as any)["element"];
  }

  set element(e: HTMLElement | null) {
    (this.meta as any)["element"] = e;
  }

  isAnyChildInvalid(): boolean {
    return this.getChildControls().some((x) => !x.current.valid);
  }

  isAnyChildDirty(): boolean {
    const e = this._elems;
    if (e) {
      const initialValues = (this.current.initialValue as any[]) ?? [];
      if (e.length !== initialValues.length) return true;
      return e.some((x, i) => !x.isValueEqual(initialValues[i]));
    } else if (this._fields) {
      return this.getChildControls().some(
        (x) => x.isAnyChildDirty() || x.current.dirty,
      );
    }
    return false;
  }

  get hasChildren(): boolean {
    return Boolean(this._elems || this._fields);
  }

  set initialValue(v: V) {
    this._initialValue = v;
    const change = ControlChange.InitialValue;
    if (!this.hasChildren || v == null) {
      this._childSync &= ~ChildSyncFlags.InitialValue;
      this.runChange(change | this.updateDirty(!this.isEqual(v, this._value)));
    } else {
      this._childSync =
        this._childSync |
        ((ChildSyncFlags.ChildrenInitialValues | ChildSyncFlags.Dirty) &
          ~ChildSyncFlags.InitialValue);
      this.runChange(change);
    }
  }

  setValueAndInitial(v: V, iv: V): Control<V> {
    groupedChanges(() => {
      this.value = v;
      this.initialValue = iv;
    });
    return this;
  }

  setValue(newValue: (current: V) => V): Control<V> {
    this.value = newValue(this.current.value);
    return this;
  }

  setInitialValue(v: V): Control<V> {
    return this.setValueAndInitial(v, v);
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
        true,
      );
    });
  }

  visitChildren(
    visit: (c: ControlImpl<any>) => boolean,
    doSelf?: boolean,
    recurse?: boolean,
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
  set disabled(disabled: boolean) {
    this.updateAll((c) => c.updateDisabled(disabled));
  }

  /**
   * Set the touched flag.
   * @param touched
   */
  set touched(touched: boolean) {
    this.updateAll((c) => c.updateTouched(touched));
  }

  as<NV extends V>(): Control<NV> {
    return this as unknown as Control<NV>;
  }
}

function initialValidation<V, M>(
  v: V,
  _setup?: ControlSetup<V, M> | (() => ControlSetup<V, M>),
): [{ [k: string]: string } | null, boolean] {
  if (!_setup) {
    return [null, true];
  }
  const setup = getSetup(_setup);
  const error = setup.validator?.(v);
  if (error) {
    return [{ default: error }, false];
  }
  if (Array.isArray(v) && setup.elems) {
    return [null, v.every((x) => initialValidation(x, setup.elems)[1])];
  }
  if (typeof v === "object" && v && setup.fields) {
    return [
      null,
      Object.entries(setup.fields).every(
        (x) =>
          initialValidation(
            v[x[0] as keyof V],
            x[1] as ControlSetup<any, M>,
          )[1],
      ),
    ];
  }
  return [null, true];
}

function getSetup<V, M>(
  setup?: ControlSetup<V, M> | (() => ControlSetup<V, M>),
) {
  return setup ? (typeof setup === "function" ? setup() : setup) : {};
}

export function newControl<V>(
  value: V,
  setup?: ControlSetup<V, any> | (() => ControlSetup<V, any>),
  initialValue?: V,
): Control<V> {
  const realSetup = getSetup(setup);
  if (realSetup.use) return realSetup.use;
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
    valid ? ControlFlags.Valid : ControlFlags.None,
    realSetup,
  );
}

function makeChildListener<V>(pc: ControlImpl<V>): ChangeListener {
  return [
    ControlChange.Value |
      ControlChange.Valid |
      ControlChange.Touched |
      ControlChange.InitialValue |
      ControlChange.Dirty |
      ControlChange.Structure,
    (child, change) => {
      let flags: ControlChange = change & ControlChange.Structure;
      const childKey = pc.getParentMeta(child)![0];
      const um = pc.meta[UndefinedMeta];
      const undefFlags: ChildSyncFlags =
        typeof childKey === "string" && um ? um[childKey] ?? 0 : 0;
      let newUndef = undefFlags;
      if (change & ControlChange.Value) {
        newUndef &= ~ChildSyncFlags.Value;
        if (
          pc._childSync & ChildSyncFlags.Value ||
          (pc._value as any)[childKey] !== child.current.value
        ) {
          flags |= ControlChange.Value;
          pc._childSync |= ChildSyncFlags.Value | ChildSyncFlags.Dirty;
        }
      }
      if (change & ControlChange.InitialValue) {
        newUndef &= ~ChildSyncFlags.InitialValue;
        if (
          pc._childSync & ChildSyncFlags.InitialValue ||
          (pc._initialValue as any)[childKey] !== child.current.initialValue
        ) {
          flags |= ControlChange.InitialValue;
          pc._childSync |= ChildSyncFlags.InitialValue | ChildSyncFlags.Dirty;
        }
      }
      if (change & ControlChange.Valid) {
        pc._childSync |= ChildSyncFlags.Valid;
      }
      if (change & ControlChange.Dirty) {
        pc._childSync |= ChildSyncFlags.Dirty;
      }
      if (change & ControlChange.Touched) {
        flags |= pc.updateTouched(child.current.touched || pc.current.touched);
      }
      if (undefFlags !== newUndef) {
        if (newUndef) um[childKey] = newUndef;
        else delete um[childKey];
      }
      pc.runChange(flags);
    },
  ];
}

export function controlGroup<C extends { [k: string]: Control<any> }>(
  fields: C,
): Control<{ [K in keyof C]: ControlValue<C[K]> }> {
  return new ControlImpl<{ [K in keyof C]: ControlValue<C[K]> }>(
    {} as any,
    {} as any,
    null,
    ControlFlags.Valid,
    {},
    fields,
    ChildSyncFlags.InitialValue |
      ChildSyncFlags.Value |
      ChildSyncFlags.Valid |
      ChildSyncFlags.Dirty,
  );
}

export function notEmpty<V>(msg: string): (v: V) => string | undefined {
  return (v: V) => (!v ? msg : undefined);
}

export type AnyControl = Control<any>;

function createArrayChildren<V>(
  valArr: V[],
  iArr: V[],
  syncChild: (i: number, v: V, iv: V) => Control<V>,
): Control<V>[] {
  return valArr.map((_, i) => {
    const haveValue = i < valArr.length;
    const haveInitial = i < iArr.length;
    const firstValue = haveValue ? valArr[i] : iArr[i];
    return syncChild(i, firstValue, haveInitial ? iArr[i] : firstValue);
  });
}

export function getFieldValues<
  V extends { [k: string]: any },
  K extends keyof V,
>(c: Control<V>, ...keys: K[]): { [NK in K]: V[NK] } {
  const fields = c.fields;
  return Object.fromEntries(
    keys.map((k) => [k, fields![k as string].value]),
  ) as {
    [NK in K]: V[NK];
  };
}

export function findElement<T>(
  control: Control<T[] | undefined> | undefined,
  pred: (c: Control<T>) => unknown,
): Control<T> | undefined {
  return control?.current.elements?.find(pred);
}

export function updateElements<V>(
  control: Control<V[] | null | undefined>,
  cb: (elems: Control<V>[]) => Control<V>[],
): void {
  const c = control as unknown as ControlImpl<V[]>;
  const e = control.current.elements ?? [];
  const newElems = cb(e);
  if (!basicShallowEquals(e, newElems)) {
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
  oldElems: Control<any>[],
) {
  newElems.forEach((x, i) => {
    c.attachParentListener(x, i);
  });
  oldElems
    .filter((x) => !newElems.includes(x))
    .forEach((x) => c.detachParentListener(x));
}

export function setFields<V, OTHER extends { [p: string]: any }>(
  control: Control<V>,
  fields: {
    [K in keyof OTHER]-?: Control<OTHER[K]>;
  },
): Control<V & OTHER> {
  const c = control as ControlImpl<V>;
  const exFields = c._fields ?? {};
  let changed = false;
  Object.entries(fields).forEach(([k, newField]) => {
    const exField = exFields[k];
    if (exField !== newField) {
      changed = true;
      if (exField) c.detachParentListener(exField);
      exFields[k] = newField;
      c.attachParentListener(newField, k);
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

/**
 * Add an element to a Control containing an array.
 * @param control The Control containing an array
 * @param child The child element
 * @param index The array index or `Control` to insert at. If not supplied the element will be put at the end of the array.
 * @param insertAfter If true it will insert after the given index, if not it will insert before.
 * @return The newly created element `Control` will be returned.
 */
export function addElement<V>(
  control: Control<V[] | undefined | null>,
  child: V,
  index?: number | Control<V> | undefined,
  insertAfter?: boolean,
): Control<V> {
  const e = control.current.elements;
  if (e) {
    const c = control as unknown as ControlImpl<V[]>;
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
    updateElements(control as Control<V[]>, () => newElems);
    return newChild;
  } else {
    control.value = [child];
    return control.as<V[]>().current.elements[0];
  }
}

/**
 * Remove an element from a `Control` containing an array.
 * @param control The Control containing an array
 * @param child The child index or `Control` to remove from the array.
 */
export function removeElement<V>(
  control: Control<V[] | undefined | null>,
  child: number | Control<V>,
): void {
  const c = control.current.elements;
  if (c) {
    const wantedIndex = typeof child === "number" ? child : c.indexOf(child);
    if (wantedIndex < 0 || wantedIndex >= c.length) return;
    updateElements(control as Control<V[]>, (ex) =>
      ex.filter((x, i) => i !== wantedIndex),
    );
  }
}

export function newElement<V>(control: Control<V[]>, elem: V): Control<V> {
  return newControl(elem, (control as unknown as ControlImpl<V[]>).setup.elems);
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
export function trackControlChange(c: Control<any>, change: ControlChange) {
  collectChange(c, change);
}

class ControlStateImpl<V> implements ControlProperties<V> {
  constructor(private control: ControlImpl<V>) {}

  get fields() {
    if (this.isNull) return undefined;
    const c = this.control as unknown as ControlImpl<{ [k: string]: any }>;
    c._fields ??= {};
    if (!c._fieldsProxy) {
      c._fieldsProxy = new Proxy<{ [k: string]: Control<any> }>(c._fields, {
        get(
          target: { [k: string | symbol]: Control<any> },
          p: string | symbol,
          receiver: any,
        ): any {
          if (typeof p !== "string") return undefined;
          if (p in target) {
            return target[p];
          }
          const cv = c.current;
          const thisInitial = cv.initialValue;
          const uFlags =
            (p in cv.value ? 0 : ChildSyncFlags.Value) |
            (thisInitial && p in thisInitial ? 0 : ChildSyncFlags.InitialValue);
          if (uFlags) {
            const m = (c.meta[UndefinedMeta] ??= {});
            m[p] = uFlags;
          }
          const newChild = newControl(
            cv.value[p],
            c.setup.fields?.[p],
            thisInitial?.[p],
          );
          newChild.touched = false;
          newChild.disabled = cv.disabled;
          c.attachParentListener(newChild, p);
          target[p] = newChild;
          return newChild;
        },
      });
    }
    return c._fieldsProxy as any;
  }

  get isNull() {
    return this.control._value == null;
  }

  get value() {
    const c = this.control;
    if (!(c._childSync & ChildSyncFlags.Value)) return c._value;

    if (c._elems) {
      c._value = c._elems.map((x) => x.current.value) as any;
    } else if (c._fields) {
      const fieldsToSync = c._fields;
      const newValue = { ...c._value };
      const um = c.meta[UndefinedMeta];
      for (const k in fieldsToSync) {
        const fv = fieldsToSync[k]!.current.value;
        if (um && fv === undefined && um[k] & ChildSyncFlags.Value) {
          delete newValue[k as keyof V];
        } else newValue[k as keyof V] = fv;
      }
      c._value = newValue;
    }
    c._childSync &= ~ChildSyncFlags.Value;
    return c._value;
  }

  get initialValue() {
    const c = this.control;
    if (!(c._childSync & ChildSyncFlags.InitialValue)) return c._initialValue;

    if (c._elems) {
      const initialValues = [...((c._initialValue as any[]) ?? [])];
      if (Array.isArray(c.current.value)) {
        c._elems.forEach((x, i) => (initialValues[i] = x.current.initialValue));
      }
      c._initialValue = initialValues as any;
    } else if (c._fields) {
      const fieldsToSync = c._fields;
      const newValue = { ...c._initialValue };
      const um = c.meta[UndefinedMeta];
      for (const k in fieldsToSync) {
        const fv = fieldsToSync[k].current.initialValue;
        if (um && fv === undefined && um[k] & ChildSyncFlags.InitialValue)
          delete newValue[k as keyof V];
        else newValue[k as keyof V] = fv;
      }
      c._initialValue = newValue;
    }
    c._childSync &= ~ChildSyncFlags.InitialValue;
    return c._initialValue;
  }

  get error() {
    if (!this.control._errors) return null;
    return Object.values(this.control._errors)[0];
  }

  get errors() {
    return this.control._errors ?? {};
  }

  get valid() {
    return Boolean(this.control.flags & ControlFlags.Valid);
  }

  get dirty() {
    return Boolean(this.control.flags & ControlFlags.Dirty);
  }

  get touched() {
    return Boolean(this.control.flags & ControlFlags.Touched);
  }

  get disabled() {
    return Boolean(this.control.flags & ControlFlags.Disabled);
  }

  get elements(): any {
    if (this.isNull) return undefined;
    const c = this.control as unknown as ControlImpl<V[]>;
    const e = c._elems;
    if (e) {
      return e;
    } else {
      const valueArr = (c._value as any) ?? [];
      const initialArr = (c._initialValue as any) ?? [];
      c._elems = createArrayChildren<any>(valueArr, initialArr, (n, i, iv) =>
        c.attachParentListener(newControl(i, c.setup.elems, iv), n),
      );
    }
    return c._elems;
  }
}

export function basicShallowEquals(a: any, b: any): boolean {
  if (a === b) return true;
  if (a && b && typeof a == "object" && typeof b == "object") {
    if (a.constructor !== b.constructor) return false;

    let length, i, keys;
    if (Array.isArray(a)) {
      length = a.length;
      if (length != b.length) return false;
      for (i = length; i-- !== 0; ) if (a[i] !== b[i]) return false;
      return true;
    }
    keys = Object.keys(a);
    length = keys.length;
    if (length !== Object.keys(b).length) return false;

    for (i = length; i-- !== 0; )
      if (!Object.prototype.hasOwnProperty.call(b, keys[i])) return false;

    for (i = length; i-- !== 0; ) {
      let key = keys[i];
      if (a[key] !== b[key]) return false;
    }
    return true;
  }
  return a !== a && b !== b;
}

export class SubscriptionTracker {
  private _listener: ChangeListenerFunc<any> = (control, change) => {
    if (this.listener) this.listener(control, change);
  };
  listener?: ChangeListenerFunc<any>;
  changeListener: [ChangeListenerFunc<any>, (destroy?: boolean) => void];
  previousTracker?: ChangeListenerFunc<any>;

  constructor() {
    this.changeListener = makeChangeTracker(this._listener);
  }

  start() {
    this.previousTracker = collectChange;
    collectChange = this.changeListener[0];
  }

  run<V>(cb: () => V): V {
    this.start();
    try {
      return cb();
    } finally {
      this.stop();
    }
  }

  stop() {
    if (this.previousTracker) collectChange = this.previousTracker;
    this.changeListener[1]();
  }

  destroy() {
    this.changeListener[1](true);
  }
}

const restoreControlSymbol = Symbol("restoreControl");

export function trackedValue<A>(
  c: Control<A>,
  tracker?: ChangeListenerFunc<any>,
): A {
  const cc = c.current;
  const cv = cc.value;
  if (cv == null) {
    t(ControlChange.Structure);
    return cv;
  }
  if (typeof cv !== "object") {
    t(ControlChange.Value);
    return cv;
  }
  t(ControlChange.Structure);
  return new Proxy(cv, {
    get(target: object, p: string | symbol, receiver: any): any {
      if (p === restoreControlSymbol) return c;
      if (Array.isArray(cv)) {
        if (p === "length") return (cc.elements as any).length;
        if (typeof p === "symbol" || p[0] > "9" || p[0] < "0")
          return Reflect.get(cv, p);
        const nc = (cc.elements as any)[p];
        if (typeof nc === "function") return nc;
        if (nc == null) return null;
        return trackedValue(nc, tracker);
      }
      return trackedValue((cc.fields as any)[p], tracker);
    },
  }) as A;

  function t(cc: ControlChange) {
    return (tracker ?? collectChange)(c, cc);
  }
}

export function unsafeRestoreControl<A>(v: A): Control<A> | undefined {
  return (v as any)[restoreControlSymbol];
}

type TrackedSubscription = [
  Control<any>,
  Subscription | undefined,
  ControlChange,
];

export function makeChangeTracker(
  listen: ChangeListenerFunc<any>,
): [ChangeListenerFunc<any>, (destroy?: boolean) => void] {
  let subscriptions: TrackedSubscription[] = [];
  return [
    (c, change) => {
      const existing = subscriptions.find((x) => x[0] === c);
      if (existing) {
        existing[2] |= change;
      } else {
        subscriptions.push([c, c.subscribe(listen, change), change]);
      }
    },
    (destroy) => {
      if (destroy) {
        subscriptions.forEach((x) => x[0].unsubscribe(listen));
        subscriptions = [];
        return;
      }
      let removed = false;
      subscriptions.forEach((sub) => {
        const [c, s, latest] = sub;
        if (s) {
          if (s[0] !== latest) {
            if (!latest) {
              removed = true;
              c.unsubscribe(s);
              sub[1] = undefined;
            } else s[0] = latest;
          }
        } else {
          sub[1] = c.subscribe(listen, latest);
        }
        sub[2] = 0;
      });
      if (removed) subscriptions = subscriptions.filter((x) => x[1]);
    },
  ];
}

export function collectChanges<A>(
  listener: ChangeListenerFunc<any>,
  run: () => A,
): A {
  const prevCollect = collectChange;
  collectChange = listener;
  try {
    return run();
  } finally {
    collectChange = prevCollect;
  }
}
