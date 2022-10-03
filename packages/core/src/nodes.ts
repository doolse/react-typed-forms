export enum ControlFlags {
  Valid = 1,
  Touched = 2,
  Dirty = 4,
  Disabled = 8,
}

enum ChildSyncFlags {
  Valid = 1,
  Dirty = 4,
  Value = 16,
  InitialValue = 32,
  ChildrenValues = 64,
  ChildrenInitialValues = 128,
}

export enum ControlChange {
  Valid = 1,
  Touched = 2,
  Dirty = 4,
  Disabled = 8,
  Value = 16,
  InitialValue = 32,
  Error = 64,
  All = Value | Valid | Touched | Disabled | Error | Dirty | InitialValue,
  Validate = 128,
}

export type ControlValidator<V> = ((v: V) => string | undefined) | null;

export type ChangeListener<V, S> = [
  ControlChange,
  (control: Control<V, S>, cb: ControlChange) => void
];

let controlCount = 0;

export interface BaseControlMetadata {
  element?: HTMLElement | null;
}

export type FormControlFields<V, M> = V extends {
  [k: string]: any;
}
  ? { [K in keyof V]-?: Control<V[K], M> }
  : {};

type ElemType<V> = NonNullable<V> extends (infer E)[] ? E : any;

export type RetainOptionality<V> =
  | (undefined extends V ? undefined : never)
  | (null extends V ? null : never);

export type ControlConfigure<V, M> = (
  b: ControlBuilder<V, M>
) => ControlBuilder<V, M>;

export interface Control<V, M = BaseControlMetadata> {
  readonly uniqueId: number;
  readonly stateVersion: number;
  readonly value: V;
  readonly initialValue: V;
  readonly error?: string;
  readonly valid: boolean;
  readonly dirty: boolean;
  readonly disabled: boolean;
  readonly touched: boolean;
  meta: Partial<M>;
  setValue(v: V, initial?: boolean): Control<V, M>;
  setInitialValue(v: V): Control<V, M>;
  setValueAndInitial(v: V, iv: V): Control<V, M>;
  groupedChanges(run: () => void): Control<V, M>;
  isValueEqual(v: V): boolean;
  unfreeze(): void;
  freeze(): void;
  addChangeListener(
    listener: (control: Control<V, M>, change: ControlChange) => void,
    mask?: ControlChange
  ): void;
  removeChangeListener(
    listener: (control: Control<V, M>, change: ControlChange) => void
  ): void;
  setError(error?: string | null): Control<V, M>;
  validate(): Control<V, M>;

  setDisabled(disabled: boolean): Control<V, M>;
  setTouched(showValidation: boolean): void;
  markAsClean(): void;
  clearErrors(): void;
  lookupControl(path: (string | number)[]): Control<any, M> | undefined;

  element: HTMLElement | null;

  as<NV extends V>(): Control<NV, M>;

  /**
   * @deprecated Use .value
   */
  toValue(): V;

  /**
   * @deprecated Use .value
   */
  toObject(): V;

  // fields
  readonly fields: FormControlFields<NonNullable<V>, M> | RetainOptionality<V>;

  addFields<OTHER extends { [k: string]: any }>(v: {
    [K in keyof OTHER]-?: Control<OTHER[K], M>;
  }): Control<V & OTHER, M>;

  /**
   *
   * @deprecated Use controlGroup() instead
   * @param select
   */
  subGroup<OUT extends { [k: string]: Control<any> }>(
    select: (fields: FormControlFields<NonNullable<V>, M>) => OUT
  ): Control<{ [K in keyof OUT]: ControlValue<OUT[K]> }>;

  readonly elems: Control<ElemType<V>, M>[] | RetainOptionality<V>;
  readonly elementBuilder: ControlBuilder<ElemType<V>, M>;

  update(
    cb: (
      elems: Control<ElemType<V>, M>[],
      makeChild: (e: ElemType<V>) => Control<ElemType<V>, M>
    ) => Control<ElemType<V>, M>[]
  ): void;

  remove(child: number | Control<ElemType<V>, M>): void;

  add(
    child: ElemType<V>,
    index?: number | Control<ElemType<V>, M>,
    insertAfter?: boolean
  ): Control<ElemType<V>, M>;

  markArrayClean(): void;

  /**
   * @deprecated Use .value
   */
  toArray(): V;
}

interface FieldsChildren<V, M> {
  fields: { [K in keyof V]?: Control<V[K], M> };
  fieldsProxy?: FormControlFields<NonNullable<V>, M>;
  configureChild: (k: string) => ControlConfigure<any, M>;
}

export interface ArrayChildren<V, M> {
  elems: Control<V, M>[];
  configureChild: ControlConfigure<V, M>;
}

class ControlImpl<V, M> implements Control<V, M> {
  uniqueId = ++controlCount;
  _childSync: ChildSyncFlags = 0;

  private _childListener?: ChangeListener<any, M>;
  private listeners: ChangeListener<V, M>[] = [];

  constructor(
    public _value: V,
    public _initialValue: V,
    public error: string | undefined,
    public meta: Partial<M>,
    public flags: ControlFlags,
    public validator?: ControlValidator<V>,
    private equals?: (a: V, b: V) => boolean,
    public _children?: FieldsChildren<V, M> | ArrayChildren<ElemType<V>, M>
  ) {}

  update(
    cb: (
      elems: Control<ElemType<V>, M>[],
      makeChild: (e: ElemType<V>) => Control<ElemType<V>, M>
    ) => Control<ElemType<V>, M>[]
  ): void {
    const c = this.ensureArray();
    const newElems = cb(c.elems, (v) =>
      c.configureChild(controlBuilder()).build(v, v)
    );
    if (c.elems !== newElems) {
      this.ensureArrayAttachment(newElems, c.elems);
      this._children = { ...c, elems: newElems };
      this._childSync |=
        ChildSyncFlags.Value | ChildSyncFlags.Dirty | ChildSyncFlags.Valid;
      this.runChange(ControlChange.Value);
    }
  }

  ensureArrayAttachment(
    newElems: Control<ElemType<V>, M>[],
    oldElems: Control<ElemType<V>, M>[]
  ) {
    newElems
      .filter((x) => !oldElems.includes(x))
      .forEach((x) => this.attachParentListener(x));
    oldElems
      .filter((x) => !newElems.includes(x))
      .forEach((x) => x.removeChangeListener(this.childListener[1]));
  }

  remove(child: number | Control<ElemType<V>, M>): void {
    const c = this.ensureArray();
    const wantedIndex =
      typeof child === "number" ? child : c.elems.indexOf(child);
    if (wantedIndex < 0 || wantedIndex >= c.elems.length) return;
    this.update((ex) => ex.filter((x, i) => i !== wantedIndex));
  }

  add(
    child: ElemType<V>,
    index?: number | Control<ElemType<V>, M>,
    insertAfter?: boolean
  ): Control<ElemType<V>, M> {
    if (!this._value) {
      this.setValue([child] as any);
      return this.elems![0] as Control<ElemType<V>, M>;
    }
    const c = this.ensureArray();
    const newChild = c.configureChild(controlBuilder()).build(child, child);
    if (typeof index === "object") {
      index = c.elems.indexOf(index as any);
    }
    let newElems = [...c.elems];
    if (typeof index === "number" && index < c.elems.length) {
      newElems.splice(index + (insertAfter ? 1 : 0), 0, newChild);
    } else {
      newElems.push(newChild);
    }
    this.update((ex) => newElems);
    return newChild;
  }

  isEqual(a: V, b: V): boolean {
    if (this.equals) return this.equals(a, b);
    return a === b;
  }

  isValueEqual(v: V): boolean {
    const c = this._children;
    if (c) {
      if (isArrayChildren(c)) {
        if (!Array.isArray(v)) return false;
        if (c.elems.length !== v.length) return false;
        return c.elems.every((x, i) => x.isValueEqual(v[i]));
      } else {
        for (const k in c.fields) {
          if (!c.fields[k]!.isValueEqual(v[k])) return false;
        }
        return true;
      }
    }
    return this.isEqual(this.value, v);
  }

  stateVersion: number = 0;
  /**
   * @internal
   */
  freezeCount: number = 0;
  /**
   * @internal
   */
  frozenChanges: ControlChange = 0;

  /**
   * @internal
   */
  updateError(error?: string | null): ControlChange {
    if (this.error !== error) {
      this.error = error ? error : undefined;
      this._childSync |= ChildSyncFlags.Valid;
      return ControlChange.Error;
    }
    return 0;
  }

  clearErrors(): this {
    this.updateAll((c) => c.updateError(undefined));
    return this;
  }

  lookupControl(path: (string | number)[]): Control<any, M> | undefined {
    let base = this as Control<any, M>;
    let index = 0;
    while (index < path.length && base) {
      const childId = path[index];
      if (typeof childId === "string") {
        base = base.as<Record<string, any>>().fields?.[childId];
      } else {
        base = base.as<any[]>().elems?.[childId];
      }
      index++;
    }
    return base;
  }

  get valid() {
    return Boolean(this.flags & ControlFlags.Valid);
  }

  get dirty() {
    return Boolean(this.flags & ControlFlags.Dirty);
  }

  get disabled() {
    return Boolean(this.flags & ControlFlags.Disabled);
  }

  get touched() {
    return Boolean(this.flags & ControlFlags.Touched);
  }

  setFlag(flag: ControlFlags, b: boolean) {
    this.flags = b ? this.flags | flag : this.flags & ~flag;
  }

  /**
   * @internal
   */
  updateValid(valid: boolean): ControlChange {
    if (this.valid !== valid) {
      this.setFlag(ControlFlags.Valid, valid);
      return ControlChange.Valid;
    }
    return 0;
  }

  /**
   * @internal
   */
  updateDisabled(disabled: boolean): ControlChange {
    if (this.disabled !== disabled) {
      this.setFlag(ControlFlags.Disabled, disabled);
      return ControlChange.Disabled;
    }
    return 0;
  }

  /**
   * @internal
   */
  updateDirty(dirty: boolean): ControlChange {
    if (this.dirty !== dirty) {
      this.setFlag(ControlFlags.Dirty, dirty);
      return ControlChange.Dirty;
    }
    return 0;
  }

  /**
   * @internal
   */
  updateTouched(touched: boolean): ControlChange {
    if (this.touched !== touched) {
      this.setFlag(ControlFlags.Touched, touched);
      return ControlChange.Touched;
    }
    return 0;
  }

  get childListener(): ChangeListener<any, M> {
    if (!this._childListener) {
      this._childListener = makeChildListener<V, M>(this);
    }
    return this._childListener;
  }

  /**
   * @internal
   */
  private runListeners(changed: ControlChange) {
    this.frozenChanges = 0;
    this.stateVersion++;
    this.listeners.forEach(([m, cb]) => {
      if ((m & changed) !== 0) cb(this, changed);
    });
  }

  doFieldsSync(
    v: V,
    children: FieldsChildren<V, M>,
    setter: (c: Control<any, M>, v: any) => void
  ) {
    const childFields = children.fields;
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
  runChange(changed: ControlChange): Control<V, M> {
    const needsChangeSync =
      this._childSync &
      (ChildSyncFlags.Dirty |
        ChildSyncFlags.Valid |
        ChildSyncFlags.ChildrenValues |
        ChildSyncFlags.ChildrenInitialValues);
    if (changed || needsChangeSync) {
      if (this.freezeCount === 0) {
        if (
          needsChangeSync &
          (ChildSyncFlags.ChildrenValues | ChildSyncFlags.ChildrenInitialValues)
        ) {
          this.groupedChanges(() => {
            const c = this._children;
            if (!c) return;
            if (isArrayChildren(c)) {
              const valArr =
                this._childSync & ChildSyncFlags.ChildrenValues
                  ? (this._value as any[])
                  : (c.elems as any[]);
              const initialArr = this._initialValue as any[];
              const newChildren = createArrayChildren(
                valArr,
                initialArr,
                (i, v, iv) => {
                  if (i < c.elems.length) {
                    const existing = c.elems[i];
                    existing.groupedChanges(() => {
                      if (this._childSync & ChildSyncFlags.ChildrenValues) {
                        existing.setValue(v);
                      }
                      if (
                        this._childSync & ChildSyncFlags.ChildrenInitialValues
                      ) {
                        existing.setInitialValue(iv);
                      }
                    });
                    return existing;
                  } else {
                    return this.attachParentListener(
                      c.configureChild(controlBuilder()).build(v, iv)
                    );
                  }
                }
              );
              this._children = {
                ...c,
                elems: newChildren as Control<ElemType<V>, M>[],
              };
            } else {
              if (this._childSync & ChildSyncFlags.ChildrenValues) {
                this.doFieldsSync(this._value, c, (x, v) => x.setValue(v));
              }
              if (this._childSync & ChildSyncFlags.ChildrenInitialValues) {
                this.doFieldsSync(this._initialValue, c, (x, v) =>
                  x.setInitialValue(v)
                );
              }
            }
            this._childSync =
              (this._childSync &
                ~(
                  ChildSyncFlags.ChildrenValues |
                  ChildSyncFlags.ChildrenInitialValues
                )) |
              (ChildSyncFlags.Dirty | ChildSyncFlags.Valid);
          });
        }
        if (this._childSync & ChildSyncFlags.Valid) {
          this._childSync &= ~ChildSyncFlags.Valid;
          changed |= this.updateValid(
            !(Boolean(this.error) || this.isAnyChildInvalid())
          );
        }
        if (this._childSync & ChildSyncFlags.Dirty) {
          const anyChildDirty = this.isAnyChildDirty();
          this._childSync &= ~ChildSyncFlags.Dirty;
          changed |= this.updateDirty(anyChildDirty);
        }
        this.runListeners(changed);
      } else {
        this.frozenChanges |= changed;
      }
    }
    return this;
  }

  groupedChanges(run: () => void): this {
    this.freeze();
    run();
    this.unfreeze();
    return this;
  }

  unfreeze() {
    this.freezeCount--;
    if (this.freezeCount === 0) {
      this.runChange(this.frozenChanges);
    }
  }

  freeze() {
    this.freezeCount++;
  }

  addChangeListener(
    listener: (control: Control<V, M>, change: ControlChange) => void,
    mask?: ControlChange
  ) {
    this.listeners = [
      ...this.listeners,
      [mask ? mask : ControlChange.All, listener],
    ];
  }

  removeChangeListener(
    listener: (control: Control<V, M>, change: ControlChange) => void
  ) {
    this.listeners = this.listeners.filter((cl) => cl[1] !== listener);
  }

  setError(error?: string | null): Control<V, M> {
    return this.runChange(this.updateError(error));
  }

  /**
   * Run validation listeners.
   */
  validate(): Control<V, M> {
    return this.runChange(ControlChange.Validate);
  }

  attachParentListener<A>(c: Control<A, M>): Control<A, M> {
    c.addChangeListener(this.childListener[1], this.childListener[0]);
    return c;
  }

  ensureArray(): ArrayChildren<ElemType<V>, M> {
    const c = this._children;
    if (c) {
      if (!isArrayChildren(c)) {
        throw "Not an array";
      }
      return c;
    } else {
      const valueArr = (this._value as any) ?? [];
      const initialArr = (this._initialValue as any) ?? [];
      this._children = {
        elems: createArrayChildren<ElemType<V>, M>(
          valueArr,
          initialArr,
          (n, i, iv) =>
            this.attachParentListener(
              controlBuilder<ElemType<V>, M>().build(i, iv)
            )
        ),
        configureChild: (x) => x,
      } as ArrayChildren<ElemType<V>, M>;
    }
    return this._children;
  }

  ensureFields(): FieldsChildren<V, M> {
    const c = this._children;
    if (c) {
      if (!("fields" in c)) {
        throw "Not Fields";
      }
      return c;
    }
    this._children = {
      fields: {},
      configureChild: () => (x: ControlBuilder<any, any>) => x,
    };
    return this._children;
  }

  get fields(): FormControlFields<NonNullable<V>, M> | RetainOptionality<V> {
    if (this._value == null) {
      return this._value as any;
    }
    const children = this.ensureFields();
    if (!children.fieldsProxy) {
      const t = this;
      children.fieldsProxy = new Proxy<FormControlFields<NonNullable<V>, M>>(
        children.fields as FormControlFields<NonNullable<V>, M>,
        {
          get(
            target: { [k: string | symbol]: Control<any, M> },
            p: string | symbol,
            receiver: any
          ): any {
            if (p in target) {
              return target[p];
            }
            const thisInitial = t.initialValue as any;
            const v = (t.value as any)[p];
            const iv = thisInitial?.[p];
            const childConfigure = children.configureChild(p as string);
            const newChild = childConfigure(controlBuilder()).build(v, iv);
            newChild.setTouched(t.touched);
            newChild.setDisabled(t.disabled);
            t.attachParentListener(newChild);
            target[p] = newChild;
            return newChild;
          },
        }
      );
    }
    return children.fieldsProxy;
  }

  get value(): V {
    if (!(this._childSync & ChildSyncFlags.Value)) return this._value;

    const c = this._children;
    if (c) {
      if (isArrayChildren(c)) {
        this._value = c.elems.map((x) => x.value) as any;
      } else if ("fields" in c) {
        const fieldsToSync = c.fields;
        const newValue = { ...this._value };
        for (const k in fieldsToSync) {
          newValue[k] = fieldsToSync[k]!.value;
        }
        this._value = newValue;
      }
    }
    this._childSync &= ~ChildSyncFlags.Value;
    return this._value;
  }

  get initialValue(): V {
    if (!(this._childSync & ChildSyncFlags.InitialValue))
      return this._initialValue;

    const c = this._children;
    if (c) {
      if (isArrayChildren(c)) {
        const initialValues = [...((this._initialValue as any[]) ?? [])];
        if (Array.isArray(this.value)) {
          c.elems.forEach((x, i) => (initialValues[i] = x.initialValue));
        }
        this._initialValue = initialValues as any;
      } else {
        const fieldsToSync = c.fields;
        const newValue = { ...this._initialValue };
        for (const k in fieldsToSync) {
          newValue[k] = fieldsToSync[k]!.initialValue;
        }
        this._initialValue = newValue;
      }
    }
    this._childSync &= ~ChildSyncFlags.InitialValue;
    return this._initialValue;
  }

  markAsClean(): void {
    this.setValueAndInitial(this.value, this.value);
  }

  get elems(): Control<ElemType<V>, M>[] | RetainOptionality<V> {
    if (this._value == null) return this._value as any;
    return this.ensureArray().elems;
  }

  get elementBuilder() {
    return this.ensureArray().configureChild(controlBuilder());
  }

  get element(): HTMLElement | null {
    return (this.meta as any)["element"];
  }

  set element(e: HTMLElement | null) {
    (this.meta as any)["element"] = e;
  }

  isAnyChildInvalid(): boolean {
    return this.getChildControls().some((x) => !x.valid);
  }

  isAnyChildDirty(): boolean {
    const c = this._children;
    if (c) {
      if (isArrayChildren(c)) {
        const initialValues = (this.initialValue as any[]) ?? [];
        if (c.elems.length !== initialValues.length) return true;
        return c.elems.some((x, i) => !x.isValueEqual(initialValues[i]));
      }
      return this.getChildControls().some(
        (x) => x.isAnyChildDirty() || x.dirty
      );
    }
    return false;
  }

  setInitialValue(v: V): Control<V, M> {
    if (this.isEqual(v, this.initialValue)) {
      return this;
    }
    this._initialValue = v;
    if (!this._children || v == null) {
      this._childSync &= ~ChildSyncFlags.InitialValue;
      return this.runChange(
        ControlChange.InitialValue |
          this.updateDirty(!this.isEqual(v, this._value))
      );
    }
    this._childSync =
      this._childSync |
      ((ChildSyncFlags.ChildrenInitialValues | ChildSyncFlags.Dirty) &
        ~ChildSyncFlags.InitialValue);
    return this.runChange(ControlChange.InitialValue);
  }

  setValueAndInitial(v: V, iv: V): Control<V, M> {
    this.groupedChanges(() => {
      this.setValue(v);
      this.setInitialValue(iv);
    });
    return this;
  }

  setValue(v: V, initial?: boolean): Control<V, M> {
    if (initial) {
      return this.setValueAndInitial(v, v);
    }
    if (this.isEqual(v, this.value)) {
      return this;
    }
    this._value = v;
    const flags =
      ControlChange.Value |
      (this.validator !== null ? this.updateError(this.validator?.(v)) : 0);
    if (!this._children || v == null) {
      this._childSync &= ~ChildSyncFlags.Value;
      return this.runChange(
        flags | this.updateDirty(!this.isEqual(v, this._initialValue))
      );
    }
    this._childSync =
      this._childSync |
      ((ChildSyncFlags.ChildrenValues | ChildSyncFlags.Dirty) &
        ~ChildSyncFlags.Value);
    return this.runChange(flags);
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
  protected updateAll(change: (c: ControlImpl<any, M>) => ControlChange) {
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
    visit: (c: ControlImpl<any, M>) => boolean,
    doSelf?: boolean,
    recurse?: boolean
  ): boolean {
    if (doSelf && !visit(this as unknown as ControlImpl<any, M>)) {
      return false;
    }
    const controls = this.getChildControls();
    for (const c of controls) {
      if (!visit(c)) {
        return false;
      }
      if (
        recurse &&
        !(c as ControlImpl<any, M>).visitChildren(visit, false, true)
      ) {
        return false;
      }
    }
    return true;
  }

  protected getChildControls(): ControlImpl<any, M>[] {
    const c = this._children;
    return c
      ? isArrayChildren(c)
        ? this.elems ?? []
        : Object.values(c.fields)
      : [];
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

  addFields<OTHER extends { [p: string]: any }>(v: {
    [K in keyof OTHER]-?: Control<OTHER[K], M>;
  }): Control<V & OTHER, M> {
    this._children = { ...this._children, ...v } as any;
    return this.as();
  }

  as<NV extends V>(): Control<NV, M> {
    return this as unknown as Control<NV, M>;
  }

  subGroup<OUT extends { [k: string]: Control<any> }>(
    select: (fields: FormControlFields<NonNullable<V>, M>) => OUT
  ): Control<{ [K in keyof OUT]: ControlValue<OUT[K]> }> {
    return controlGroup(select(this.fields!)).as();
  }

  toObject(): V {
    return this.value;
  }

  isLiveChild(v: Control<any, M>): boolean {
    return this.getChildControls().includes(v as any);
  }
}

export type ControlDefType<T> = T extends () => Control<infer V> ? V : T;

export class ControlBuilder<V, M> {
  private doBuild?: (
    value: any,
    initialValue: any,
    createImpl: () => ControlImpl<any, M>
  ) => Control<any, M>;

  constructor(
    public validator?: ControlValidator<V>,
    public meta?: Partial<M>,
    public equals?: (v: V, v2: V) => boolean,
    public parentMeta: Partial<M> = {},
    public key?: string
  ) {}

  withValidator(v: ControlValidator<V> | undefined) {
    this.validator = v;
    return this;
  }

  withMetadata(m: M): ControlBuilder<V, M> {
    this.meta = m;
    return this;
  }

  withEquals(equals: (v: V, v2: V) => boolean): ControlBuilder<V, M> {
    this.equals = equals;
    return this;
  }

  withElements(
    elemBuilder: ControlConfigure<ElemType<V>, M>
  ): ControlBuilder<V, M> {
    const builder = elemBuilder(controlBuilder<ElemType<V>, M>());
    this.doBuild = (value, initialValue, make) => {
      const c = make();
      const elems = createArrayChildren<ElemType<V>, M>(
        value ?? [],
        initialValue ?? [],
        (i, v, iv) => builder.build(v, iv)
      );
      c._children = { elems, configureChild: elemBuilder };
      c._childSync = ChildSyncFlags.Valid | ChildSyncFlags.Dirty;
      elems.forEach((x) => c.attachParentListener(x));
      c.runChange(0);
      return c;
    };
    return this;
  }

  withFields(fields: {
    [K in keyof V]?: (b: ControlBuilder<V[K], M>) => ControlBuilder<V[K], M>;
  }) {
    this.doBuild = (v, iv, make) => {
      const c = make();
      const childEntries: [string, Control<any, M>][] = fields
        ? Object.entries(fields).map(([k, b]) => [
            k,
            (b as (b: ControlBuilder<any, M>) => ControlBuilder<any, M>)(
              controlBuilder<any, M>()
            ).build(v[k], iv[k]),
          ])
        : [];
      const childFields = Object.fromEntries(childEntries);

      c._children = {
        fields: childFields as {
          [K in keyof V]?: Control<V[K], M>;
        },
        configureChild: () => configureNothing,
      };
      Object.values(childFields).forEach((x) => c.attachParentListener(x));
      c._childSync = ChildSyncFlags.Valid | ChildSyncFlags.Dirty;
      c.runChange(0);
      return c;
    };
    return this;
  }

  withBuildFunc(
    doBuild: (
      value: any,
      initialValue: any,
      createImpl: () => ControlImpl<any, M>
    ) => Control<any, M>
  ) {
    this.doBuild = doBuild;
    return this;
  }

  build(value: V, initialValue: V): Control<V, M> {
    let { error, flags } = setupValidator<V, BaseControlMetadata>(
      value,
      this.validator
    );
    flags |= (
      this.equals ? !this.equals(value, initialValue) : value !== initialValue
    )
      ? ControlFlags.Dirty
      : 0;

    const make = () =>
      new ControlImpl<any, M>(
        value,
        initialValue,
        error,
        this.meta ?? {},
        flags,
        this.validator,
        this.equals
      );
    return (
      this.doBuild ? this.doBuild(value, initialValue, make) : make()
    ) as Control<V, M>;
  }
}

function setupValidator<V, M>(
  value: V,
  validator?: ControlValidator<V>
): {
  error: string | undefined;
  flags: ControlFlags;
} {
  const error = validator?.(value);
  const flags = error ? 0 : ControlFlags.Valid;
  return { error, flags };
}

/**
 * Define a form control containing values of type V
 * @deprecated Use useControl() and validated() instead.
 * @param value Initial value for control
 * @param validator An optional synchronous validator
 * @param equals An optional equality function
 */
export function control<V>(
  value: V,
  validator?: ((v: V) => string | undefined) | null,
  equals?: (a: V, b: V) => boolean
): () => Control<V> {
  return () => {
    const { error, flags } = setupValidator<V, BaseControlMetadata>(
      value,
      validator
    );
    return new ControlImpl<V, BaseControlMetadata>(
      value,
      value,
      error,
      {},
      flags,
      validator,
      equals
    );
  };
}

function builderFormControl(child: any | (() => Control<any>)): Control<any> {
  if (typeof child === "function") {
    return child();
  }
  return control(child)();
}

function initChild<V, M>(c: Control<V, M>, v: V, iv: V) {
  c.setValue(iv, true);
  c.setValue(v);
}

/**
 * @deprecated Use withElems instead
 */
export function arrayControl<CHILD>(
  child: CHILD
): () => Control<(CHILD extends () => Control<infer V> ? V : CHILD)[]> {
  return () => {
    return new ControlImpl<any[], BaseControlMetadata>(
      [],
      [],
      undefined,
      { element: null },
      ControlFlags.Valid,
      undefined,
      undefined,
      {
        elems: [],
        configureChild: (b) =>
          b.withBuildFunc((i, iv) => {
            const c = builderFormControl(child);
            initChild(c, i, iv);
            return c;
          }),
      } as ArrayChildren<any, BaseControlMetadata>
    ) as any;
  };
}

/**
 * @deprecated Use withElems() instead
 * @param children
 */
export function groupControl<DEF extends { [t: string]: any }>(
  children: DEF
): () => Control<{
  [K in keyof DEF]: ControlDefType<DEF[K]>;
}> {
  const defEntries = Object.entries(children);
  const builderProps: [string, Function][] = defEntries.filter(
    ([p, v]) => typeof v === "function"
  );
  return () => {
    let allValid = true;
    const simpleValues: [string, any][] = defEntries.filter(
      ([p, v]) => typeof v !== "function"
    );
    const initialFields: [string, Control<any>][] = builderProps.map(
      ([p, v]) => {
        const fc = v() as Control<any>;
        allValid &&= fc.valid;
        simpleValues.push([p, fc.value]);
        return [p, fc];
      }
    );
    const v = Object.fromEntries(simpleValues);
    const fields = Object.fromEntries(initialFields);
    const c = new ControlImpl(
      v,
      v,
      undefined,
      {},
      allValid ? ControlFlags.Valid : 0,
      undefined,
      undefined,
      {
        fields,
        configureChild: () => configureNothing,
      }
    );
    initialFields.forEach((x) => c.attachParentListener(x[1]));
    return c as any;
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

function makeChildListener<V, M>(
  pc: ControlImpl<V, M>
): ChangeListener<any, M> {
  return [
    ControlChange.Value |
      ControlChange.Valid |
      ControlChange.Touched |
      ControlChange.InitialValue |
      ControlChange.Dirty,
    (child, change) => {
      if (!pc.isLiveChild(child)) {
        return;
      }
      if (
        pc._childSync &
        (ChildSyncFlags.ChildrenValues | ChildSyncFlags.ChildrenInitialValues)
      ) {
        return;
      }
      const beforeSync = pc._childSync;
      const beforeFlags = pc.flags;
      let flags: ControlChange = 0;
      if (change & ControlChange.Value) {
        flags |= ControlChange.Value;
        pc._childSync |= ChildSyncFlags.Value | ChildSyncFlags.Dirty;
      }
      if (change & ControlChange.InitialValue) {
        pc._childSync |= ChildSyncFlags.InitialValue | ChildSyncFlags.Dirty;
      }
      if (change & ControlChange.Valid) {
        pc._childSync |= ChildSyncFlags.Valid;
      }
      if (change & ControlChange.Dirty) {
        // if (!(pc._childSync & ChildSyncFlags.Dirty) && !pc.dirty && child.dirty)
        //   flags |= pc.updateDirty(true);
        pc._childSync |= ChildSyncFlags.Dirty;
      }
      if (change & ControlChange.Touched) {
        flags |= pc.updateTouched(child.touched || pc.touched);
      }
      pc.runChange(flags);
    },
  ];
}

export function controlGroup<C extends { [k: string]: any }, M>(
  fields: C
): Control<{ [K in keyof C]: ControlValue<C[K]> }, M> {
  const c = new ControlImpl<{ [K in keyof C]: ControlValue<C[K]> }, M>(
    {} as any,
    {} as any,
    undefined,
    {},
    ControlFlags.Valid
  );
  c._children = {
    fields,
    configureChild: () => configureNothing,
  };
  c._childSync =
    ChildSyncFlags.InitialValue |
    ChildSyncFlags.Value |
    ChildSyncFlags.Valid |
    ChildSyncFlags.Dirty;
  c.runChange(0);
  Object.values(fields).forEach((x) =>
    x.addChangeListener(c.childListener[1], c.childListener[0])
  );
  return c;
}

export function controlBuilder<V, M = BaseControlMetadata>(
  m?: Partial<M>
): ControlBuilder<V, M> {
  return new ControlBuilder<V, M>(undefined, m);
}

export function defineFields<V, M = BaseControlMetadata>(fields: {
  [K in keyof V]?: (b: ControlBuilder<V[K], M>) => ControlBuilder<V[K], M>;
}): (b: ControlBuilder<V, M>) => ControlBuilder<V, M> {
  return (b) => b.withFields(fields);
}

export function defineElements<V, M = BaseControlMetadata>(
  elemBuilder: (
    b: ControlBuilder<ElemType<V>, M>
  ) => ControlBuilder<ElemType<V>, M>
): (b: ControlBuilder<V, M>) => ControlBuilder<V, M> {
  return (b) => b.withElements(elemBuilder);
}

export function validated<V>(
  validator: ControlValidator<V>
): <M>(b: ControlBuilder<V, M>) => ControlBuilder<V, M> {
  return (b) => b.withValidator(validator);
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

export type ControlValue<C> = C extends Control<infer V> ? V : never;

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

function isArrayChildren<V, M>(
  c: FieldsChildren<V, M> | ArrayChildren<ElemType<V>, M>
): c is ArrayChildren<ElemType<V>, M> {
  return "elems" in c;
}

function createArrayChildren<V, M>(
  valArr: V[],
  iArr: V[],
  syncChild: (i: number, v: V, iv: V) => Control<V, M>
): Control<V, M>[] {
  return valArr.map((_, i) => {
    const haveValue = i < valArr.length;
    const haveInitial = i < iArr.length;
    const firstValue = haveValue ? valArr[i] : iArr[i];
    return syncChild(i, firstValue, haveInitial ? iArr[i] : firstValue);
  });
}

const configureNothing: (
  b: ControlBuilder<any, any>
) => ControlBuilder<any, any> = (x) => x;

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
