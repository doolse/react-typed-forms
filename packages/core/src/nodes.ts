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
}

export enum ControlChange {
  Valid = 1,
  Touched = 2,
  Dirty = 4,
  Disabled = 8,
  Value = 16,
  Error = 32,
  All = Value | Valid | Touched | Disabled | Error | Dirty,
  Validate = 64,
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
  groupedChanges(run: () => void): Control<V, M>;
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

  // as<NV>(): NV extends V ? FormControl<NV, M> : never;

  /**
   * @deprecated Use .value
   */
  toObject(): V;

  // fields
  readonly fields:
    | FormControlFields<NonNullable<V>, M>
    | (undefined extends V ? undefined : never);

  addFields<OTHER extends { [k: string]: any }>(v: {
    [K in keyof OTHER]-?: Control<OTHER[K], M>;
  }): Control<V & OTHER>;

  /**
   *
   * @deprecated Use controlGroup() instead
   * @param select
   */
  subGroup<OUT extends { [k: string]: Control<any> }>(
    select: (fields: FormControlFields<NonNullable<V>, M>) => OUT
  ): Control<{ [K in keyof OUT]: ControlValue<OUT[K]> }>;

  readonly elems:
    | Control<ElemType<V>, M>[]
    | (undefined extends V ? undefined : never);

  update(
    cb: (
      elems: Control<ElemType<V>, M>[],
      makeChild: (e: ElemType<V>) => Control<ElemType<V>, M>
    ) => Control<ElemType<V>, M>[]
  ): void;

  remove(child: number | Control<ElemType<V>, M>): void;

  add(
    child: ElemType<V>,
    index?: number | Control<ElemType<V>, M>
  ): Control<ElemType<V>, M>;

  markArrayClean(): void;

  /**
   * @deprecated Use .value
   */
  toArray(): V;
}

class ControlImpl<V, M> implements Control<V, M> {
  uniqueId = ++controlCount;
  _childSync: ChildSyncFlags = 0;

  private _fieldsProxy?: { [K in keyof V]-?: Control<V[K], M> };
  private _childListener?: ChangeListener<any, M>;
  private listeners: ChangeListener<V, M>[] = [];

  _children?:
    | { [k: string | symbol]: Control<any, M> }
    | [Control<ElemType<V>, M>[], Control<ElemType<V>, M>[]];

  constructor(
    private _value: V,
    private _initialValue: V,
    public error: string | undefined,
    public meta: Partial<M>,
    protected flags: ControlFlags,
    protected validator?: ControlValidator<V>,
    private equals?: (a: V, b: V) => boolean,
    public _childBuilder?: (
      parentMeta: Partial<M>,
      key?: string
    ) => CreateControl<any, M> | undefined
  ) {}

  update(
    cb: (
      elems: Control<ElemType<V>, M>[],
      makeChild: (e: ElemType<V>) => Control<ElemType<V>, M>
    ) => Control<ElemType<V>, M>[]
  ): void {
    const [e, initial] = this.ensureArray();
    const newElems = cb(e, (v) => this.makeChild(v, v).as());
    if (e !== newElems) {
      this._children = [newElems, initial];
      this._childSync |=
        ChildSyncFlags.Value | ChildSyncFlags.Dirty | ChildSyncFlags.Valid;
      this.runChange(ControlChange.Value);
    }
  }

  remove(child: number | Control<ElemType<V>, M>): void {
    const [elems, initialElems] = this.ensureArray();
    this._children = [
      elems.filter((e, i) => i !== child && e !== child),
      initialElems,
    ];
    this._childSync |=
      ChildSyncFlags.Value | ChildSyncFlags.Dirty | ChildSyncFlags.Valid;
    this.runChange(ControlChange.Value);
  }

  add(
    child: ElemType<V>,
    index?: number | Control<ElemType<V>, M>
  ): Control<ElemType<V>, M> {
    if (this._value === undefined) {
      this.setValue([child] as any);
      return this.elems![0] as Control<ElemType<V>, M>;
    }
    const [elems, initialElems] = this.ensureArray();
    const newElems = [...elems];
    const newChild = this.makeChild(child, child).as<ElemType<V>>();
    if (typeof index === "object") {
      index = newElems.indexOf(index as any);
    }
    if (index !== undefined) {
      newElems.splice(index as number, 0, newChild);
    } else {
      newElems.push(newChild);
    }
    this._children = [newElems, initialElems];
    this._value = [] as any;
    this._childSync |=
      ChildSyncFlags.Value | ChildSyncFlags.Dirty | ChildSyncFlags.Valid;
    this.runChange(ControlChange.Value);
    return newChild;
  }

  isEqual(a: V, b: V): boolean {
    if (this.equals) return this.equals(a, b);
    return a === b;
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

  /**
   * @internal
   */
  runChange(changed: ControlChange): Control<V, M> {
    if (
      changed ||
      this._childSync & (ChildSyncFlags.Dirty | ChildSyncFlags.Valid)
    ) {
      if (this.freezeCount === 0) {
        if (this._childSync & ChildSyncFlags.Valid) {
          this._childSync &= ~ChildSyncFlags.Valid;
          changed |= this.updateValid(
            !(Boolean(this.error) || this.isAnyChildInvalid())
          );
        }
        if (this._childSync & ChildSyncFlags.Dirty) {
          this._childSync &= ~ChildSyncFlags.Dirty;
          changed |= this.updateDirty(this.isAnyChildDirty());
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

  makeChild(v: any, iv: any, p?: string | symbol): Control<any, M> {
    const newChild = (
      this._childBuilder?.(this.meta, p as string) ?? createAnyControl
    ).build(v, iv) as ControlImpl<any, M>;
    newChild.flags |=
      this.flags & (ControlFlags.Touched | ControlFlags.Disabled);
    newChild.addChangeListener(this.childListener[1], this.childListener[0]);
    return newChild;
  }

  ensureArray(): [Control<ElemType<V>, M>[], Control<ElemType<V>, M>[]] {
    if (!this._children) {
      const valueArr = (this._value as any) ?? [];
      const initialArr = (this._initialValue as any) ?? [];
      const allElems = createElemsFromArrays<ElemType<V>, M>(
        valueArr,
        initialArr,
        (i, iv) => this.makeChild(i, iv) as Control<ElemType<V>, M>
      );
      this._children = splitArrayElems(
        allElems,
        valueArr.length,
        initialArr.length
      );
      return this._children;
    }
    if (Array.isArray(this._children)) return this._children;
    throw "Not an array";
  }

  get fields():
    | FormControlFields<NonNullable<V>, M>
    | (undefined extends V ? undefined : never) {
    if (this._value === undefined) {
      return undefined as any;
    }
    if (!this._fieldsProxy) {
      if (!this._children) {
        this._children = {};
      }
      const t = this;
      const p = new Proxy(this._children!, {
        get(
          target: { [p: string | symbol]: Control<any, M> },
          p: string | symbol,
          receiver: any
        ): any {
          if (target[p]) {
            return target[p];
          }
          const thisInitial = t.initialValue as any;
          const v = (t.value as any)[p];
          const iv = thisInitial ? thisInitial[p] : v;
          const c = t.makeChild(v, iv, p);
          target[p] = c;
          return c;
        },
      });
      this._fieldsProxy = p as any;
    }
    return this._fieldsProxy as any;
  }

  get value(): V {
    if (!(this._childSync & ChildSyncFlags.Value)) return this._value;

    if (this._children) {
      if (Array.isArray(this._children)) {
        const [elems] = this._children;
        this._value = elems.map((x) => x.value) as any;
      } else {
        const newValue = { ...this._value };
        Object.entries(this._children).forEach(([p, c]) => {
          (newValue as any)[p] = c.value;
        });
        this._value = newValue;
      }
    }
    this._childSync &= ~ChildSyncFlags.Value;
    return this._value;
  }

  get initialValue(): V {
    if (!(this._childSync & ChildSyncFlags.InitialValue))
      return this._initialValue;

    if (this._children) {
      if (Array.isArray(this._children)) {
        const [, initialElems] = this._children;
        this._initialValue = initialElems.map((x) => x.initialValue) as any;
      } else {
        const newValue = { ...this._initialValue };
        Object.entries(this._children).forEach(([p, c]) => {
          (newValue as any)[p] = c.initialValue;
        });
        this._initialValue = newValue;
      }
    }
    this._childSync &= ~ChildSyncFlags.InitialValue;
    return this._initialValue;
  }

  markAsClean(): void {
    if (!this._children) {
      this._initialValue = this._value;
      this.runChange(this.updateDirty(false));
      return;
    }
    if (Array.isArray(this._children)) {
      const e = this._children[0];
      this.groupedChanges(() => {
        this.runChange(this.updateDirty(false));
        this._children = [e, e];
        this.getChildControls().forEach((x) => x.markAsClean());
      });
    } else {
      this.groupedChanges(() => {
        this.runChange(this.updateDirty(false));
        this.getChildControls().forEach((x) => x.markAsClean());
      });
    }
  }

  get elems():
    | Control<ElemType<V>, M>[]
    | (undefined extends V ? undefined : never) {
    if (this._value === undefined) return undefined as any;
    return this.ensureArray()[0] as Control<ElemType<V>, M>[];
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
      if (Array.isArray(c)) {
        const [elems, initial] = c;
        if (elems !== initial) {
          if (elems.length !== initial.length) {
            return true;
          }
          return elems.some((v, i) => v !== initial[i] || v.dirty);
        }
      }
      return this.getChildControls().some((x) => x.dirty);
    }
    return false;
  }

  setValue(v: V, initial?: boolean): Control<V, M> {
    if (this._children) {
      if (v === undefined) {
        if (initial) {
          this._initialValue = v;
        }
        const flags =
          this.updateDirty(this._initialValue !== undefined) |
          (this._value !== undefined ? ControlChange.Value : 0);
        this._value = v;
        return this.runChange(flags);
      }
      this.groupedChanges(() => {
        const wasUndefined = this._value === undefined;
        if (Array.isArray(this._children)) {
          this._value = v;
          if (initial) {
            this._initialValue = v;
          }
          const [elems, initialElems] = this._children;
          const vArr = v as unknown as any[];
          const e = vArr.map((x, i) =>
            i < elems.length
              ? elems[i].setValue(x, initial)
              : i < initialElems.length
              ? initialElems[i].setValue(x, initial)
              : this.makeChild(x, x).as<ElemType<V>>()
          );
          this._children = [e, initial ? e : initialElems];
          const sizeChanged = e.length !== elems.length;
          if (sizeChanged)
            this._childSync |= ChildSyncFlags.Dirty | ChildSyncFlags.Valid;
          return this.runChange(
            wasUndefined || sizeChanged ? ControlChange.Value : 0
          );
        } else {
          const childFields = this._children as unknown as {
            [k: string]: Control<any, M>;
          };
          this._value = v;
          if (initial) {
            this._initialValue = v;
          }
          const keys = new Set<string>();
          for (const k in v) {
            const child = childFields[k];
            child?.setValue(v[k], initial);
            keys.add(k);
          }
          for (const k in childFields) {
            if (!keys.has(k)) {
              childFields[k].setValue(undefined, initial);
            }
          }
          return this.runChange(wasUndefined ? ControlChange.Value : 0);
        }
      });
      return this;
    } else {
      if (initial) {
        this._initialValue = v;
      }
      const flags =
        this.validator !== null ? this.updateError(this.validator?.(v)) : 0;
      const nowDirty = !initial && !this.isEqual(v, this._initialValue);
      if (this.isEqual(this._value, v)) {
        return this.runChange(flags | this.updateDirty(nowDirty));
      }
      this._value = v;
      return this.runChange(
        flags | ControlChange.Value | this.updateDirty(nowDirty)
      );
    }
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
    return c ? (Array.isArray(c) ? c[0] : (Object.values(c) as any)) : [];
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
  }): Control<V & OTHER> {
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

export interface CreateControl<V, M> {
  build(value: V, initialValue: V): Control<V, M>;
}

export class ControlBuilder<V, M> implements CreateControl<V, M> {
  private setupChildren?: (
    c: ControlImpl<V, M>,
    value: any,
    initialValue: any
  ) => Control<V, M>;

  constructor(
    public validator?: ControlValidator<V>,
    public meta?: Partial<M>,
    public equals?: (v: V, v2: V) => boolean
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

  withElems(elemBuilder: ControlBuilder<ElemType<V>, M>) {
    this.setupChildren = (c, value, initialValue) => {
      const allElems = createElemsFromArrays<ElemType<V>, M>(
        value ?? [],
        initialValue ?? [],
        (v, iv) => elemBuilder.build(v, iv)
      );
      c._childBuilder = () => elemBuilder;
      c._children = splitArrayElems(
        allElems,
        value?.length ?? 0,
        initialValue?.length ?? 0
      );
      c._childSync = ChildSyncFlags.Valid | ChildSyncFlags.Dirty;
      allElems.forEach((x) =>
        x.addChangeListener(c.childListener[1], c.childListener[0])
      );
      c.runChange(0);
      return c;
    };
    return this;
  }

  withFields(fields: { [K in keyof V]?: ControlBuilder<V[K], M> }) {
    this.setupChildren = (c, v, iv) => {
      const childEntries: [string, Control<any, M>][] = fields
        ? Object.entries(fields).map(([k, b]) => [
            k,
            (b as ControlBuilder<any, M>).build(v[k], iv[k]),
          ])
        : [];
      const childFields = Object.fromEntries(childEntries);

      c._children = childFields;
      Object.values(childFields).forEach((x) =>
        x.addChangeListener(c.childListener[1], c.childListener[0])
      );
      c._childSync = ChildSyncFlags.Valid | ChildSyncFlags.Dirty;
      c.runChange(0);
      return c;
    };
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

    const c = new ControlImpl<V, M>(
      value,
      initialValue,
      error,
      this.meta ?? {},
      flags,
      this.validator,
      this.equals
    );
    return this.setupChildren?.(c, value, initialValue) ?? c;
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
      () => ({
        build(
          value: any,
          initialValue: any
        ): Control<any, BaseControlMetadata> {
          const c = builderFormControl(child);
          initChild(c, value, initialValue);
          return c;
        },
      })
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
    return new ControlImpl(
      v,
      v,
      undefined,
      {},
      allValid ? ControlFlags.Valid : 0,
      undefined,
      undefined,
      (meta, p) =>
        fields[p as string]
          ? {
              build(value: any, initialValue: any): Control<any, {}> {
                const fc = fields[p as string];
                initChild(fc, value, initialValue);
                return fc;
              },
            }
          : undefined
    ) as any;
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
  parent: ControlImpl<V, M>
): ChangeListener<any, M> {
  const pc = parent;

  return [
    ControlChange.Value |
      ControlChange.Valid |
      ControlChange.Touched |
      ControlChange.Dirty,
    (child, change) => {
      if (!pc.isLiveChild(child)) return;
      let flags: ControlChange = change & ControlChange.Value;
      pc._childSync |= change & ControlChange.Value;
      if (change & ControlChange.Valid) {
        if (!(pc._childSync & ChildSyncFlags.Valid) && pc.valid && !child.valid)
          flags |= pc.updateValid(false);
        else pc._childSync |= ChildSyncFlags.Valid;
      }
      if (change & ControlChange.Dirty) {
        pc._childSync |= ChildSyncFlags.InitialValue;
        if (!(pc._childSync & ChildSyncFlags.Dirty) && !pc.dirty && child.dirty)
          flags |= pc.updateDirty(true);
        else pc._childSync |= ChildSyncFlags.Dirty;
      }
      if (change & ControlChange.Touched) {
        flags |= pc.updateTouched(child.touched || parent.touched);
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
  c._children = fields;
  Object.values(fields).forEach((x) =>
    x.addChangeListener(c.childListener[1], c.childListener[0])
  );
  c._childSync =
    ChildSyncFlags.InitialValue |
    ChildSyncFlags.Value |
    ChildSyncFlags.Valid |
    ChildSyncFlags.Dirty;
  c.runChange(0);
  return c;
}

export function withMetadata<V, M = BaseControlMetadata>(
  m?: Partial<M>
): ControlBuilder<V, M> {
  return new ControlBuilder<V, M>(undefined, m);
}

export function withFields<V, M = BaseControlMetadata>(fields: {
  [K in keyof V]?: ControlBuilder<V[K], M>;
}) {
  return new ControlBuilder<V, M>().withFields(fields);
}

export function withElems<V, M = BaseControlMetadata>(
  element: ControlBuilder<ElemType<V>, M>
) {
  return new ControlBuilder<V, M>().withElems(element);
}

export const createAnyControl: CreateControl<any, any> = {
  build(value: any, initialValue: any): Control<any, any> {
    return new ControlImpl(
      value,
      initialValue,
      undefined,
      {},
      ControlFlags.Valid | (value !== initialValue ? ControlFlags.Dirty : 0)
    );
  },
};

export function validated<V, M = BaseControlMetadata>(
  validator: ControlValidator<V>
): ControlBuilder<V, M> {
  return new ControlBuilder<V, M>(validator);
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

export interface SelectionGroup<V> {
  selected: boolean;
  value: V;
}

export function createSelectableArray<V, M>(
  c: Control<V[], M>,
  allowed?: V[],
  key?: (v1: V) => any
): Control<SelectionGroup<V>[], M> {
  const orig = c as ControlImpl<V[], M>;
  const [origElems, origInitial] = orig.ensureArray();
  const newFields = origElems
    .map((x) =>
      controlGroup({
        selected: newBoolean(true, origInitial.includes(x)),
        value: x,
      })
    )
    .concat(
      origInitial
        .filter((x) => !origElems.includes(x))
        .map((x) =>
          controlGroup({ selected: newBoolean(false, true), value: x })
        )
    );

  if (allowed && key) {
    allowed.forEach((av) => {
      const thisKey = key(av);
      if (!newFields.some((x) => thisKey === key(x.fields.value.value))) {
        newFields.push(
          controlGroup({
            selected: newBoolean(false, false),
            value: orig.makeChild(av, av).as<V>(),
          })
        );
      }
    });
  }

  const sc = new ControlImpl<SelectionGroup<V>[], M>(
    [],
    [],
    undefined,
    {},
    ControlFlags.Valid,
    undefined,
    undefined,
    () => ({
      build(value: any, initialValue: any): Control<any, M> {
        const valueChild = orig.makeChild(value.value, initialValue.value);
        return controlGroup({
          selected: newBoolean(value.selected, initialValue.selected),
          value: valueChild,
        });
      },
    })
  );
  sc._children = [newFields, newFields];
  return sc;

  function selectionChanged() {
    const e = sc.ensureArray()[0];
    const current: Control<V, M>[] = [];
    const initial: Control<V, M>[] = [];
    e.forEach((v) => {
      const sel = v.fields.selected;
      if (sel.value) current.push(v.fields.value);
      if (sel.initialValue) initial.push(v.fields.value);
    });

    orig._children = [current, initial];
    orig._childSync |=
      ChildSyncFlags.Value | ChildSyncFlags.Dirty | ChildSyncFlags.Valid;
    orig.runChange(ControlChange.Value);
  }

  function newBoolean(v: boolean, iv: boolean) {
    const b = new ControlImpl<boolean, M>(
      v,
      iv,
      undefined,
      {},
      ControlFlags.Valid | (v !== iv ? ControlFlags.Dirty : 0)
    );
    b.addChangeListener(selectionChanged, ControlChange.Value);
    return b;
  }
}

function createElemsFromArrays<V, M>(
  valArr: V[],
  iArr: V[],
  makeChild: (v: V, iv: V) => Control<V, M>
): Control<V, M>[] {
  const mostElems = Math.max(valArr.length, iArr.length);
  const outArrElems: Control<V, M>[] = [];
  for (let i = 0; i < mostElems; i++) {
    const haveValue = i < valArr.length;
    const haveInitial = i < iArr.length;
    const firstValue = haveValue ? valArr[i] : iArr[i];
    outArrElems.push(makeChild(firstValue, haveInitial ? iArr[i] : firstValue));
  }
  return outArrElems;
}

function splitArrayElems<V, M>(
  all: Control<V, M>[],
  validLen: number,
  initialLen: number
): [Control<V, M>[], Control<V, M>[]] {
  return [all.slice(0, validLen), all.slice(0, initialLen)];
}
