export enum ControlFlags {
  Valid = 1,
  Touched = 2,
  Dirty = 4,
  Disabled = 8,
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

export type ChangeListener<V, S> = [
  ControlChange,
  (control: FormControl<V, S>, cb: ControlChange) => void
];

let controlCount = 0;

export interface BaseControlMetadata {
  element?: HTMLElement | null;
}

export type FormControlFields<V, M> = NonNullable<V> extends object
  ? { [K in keyof V]-?: FormControl<V[K], M> }
  : never;

type ElemType<V> = NonNullable<V> extends (infer E)[] ? E : unknown;

export interface FormControl<V, M = BaseControlMetadata> {
  readonly uniqueId: number;
  readonly stateVersion: number;
  readonly value: V;
  readonly initialValue: V;
  readonly error?: string;
  readonly valid: boolean;
  readonly dirty: boolean;
  readonly disabled: boolean;
  readonly touched: boolean;
  setValue(v: V, initial?: boolean): FormControl<V, M>;
  groupedChanges(run: () => void): FormControl<V, M>;
  unfreeze(): void;
  freeze(): void;
  addChangeListener(
    listener: (control: FormControl<V, M>, change: ControlChange) => void,
    mask?: ControlChange
  ): void;
  removeChangeListener(
    listener: (control: FormControl<V, M>, change: ControlChange) => void
  ): void;
  setError(error?: string | null): FormControl<V, M>;
  validate(): FormControl<V, M>;

  setDisabled(disabled: boolean): FormControl<V, M>;
  setTouched(showValidation: boolean): void;
  markAsClean(): void;
  clearErrors(): void;
  lookupControl(path: (string | number)[]): FormControl<any, M> | undefined;

  element: HTMLElement | null;

  as<NV extends V>(): FormControl<NV, M>;

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
    | FormControlFields<V, M>
    | (undefined extends V ? undefined : never);

  addFields<OTHER extends { [k: string]: any }>(v: {
    [K in keyof OTHER]-?: FormControl<OTHER[K], M>;
  }): FormControl<V & OTHER>;

  subGroup<OUT extends { [k: string]: FormControl<any> }>(
    select: (fields: FormControlFields<V, M>) => OUT
  ): FormControl<{ [K in keyof OUT]: ValueTypeForControl<OUT[K]> }>;

  readonly elems:
    | FormControl<ElemType<V>, M>[]
    | (undefined extends V ? undefined : never);

  update(
    cb: (
      elems: FormControl<ElemType<V>, M>[],
      makeChild: (e: ElemType<V>) => FormControl<ElemType<V>, Partial<M>>
    ) => FormControl<ElemType<V>, M>[]
  ): void;

  remove(child: number | FormControl<ElemType<V>, M>): void;
  add(
    child: ElemType<V>,
    index?: number | FormControl<ElemType<V>, M>
  ): FormControl<ElemType<V>, M>;
  markArrayClean(): void;
  /**
   * @deprecated Use .value
   */
  toArray(): V;
}

class ControlImpl<V, M> implements FormControl<V, M> {
  uniqueId = ++controlCount;
  _outOfSync: ControlChange = 0;

  private _fieldsProxy?: { [K in keyof V]-?: FormControl<V[K], M> };

  _children?:
    | { [k: string | symbol]: FormControl<any, M> }
    | [FormControl<ElemType<V>, M>[], FormControl<ElemType<V>, M>[]];

  constructor(
    private _value: V,
    private _initialValue: V,
    public error: string | undefined,
    protected meta: M,
    protected flags: ControlFlags,
    protected listeners: ChangeListener<V, M>[],
    private _makeChild?: (
      value: any,
      initialValue: any,
      parentMeta: M,
      flags: ControlFlags,
      listeners: ChangeListener<any, M>[],
      key?: string | symbol
    ) => FormControl<any, M>,
    private equals?: (a: V, b: V) => boolean,
    private _childListener?: ChangeListener<any, M>
  ) {}

  update(
    cb: (
      elems: FormControl<ElemType<V>, M>[],
      makeChild: (e: ElemType<V>) => FormControl<ElemType<V>, Partial<M>>
    ) => FormControl<ElemType<V>, M>[]
  ): void {
    const [e, initial] = this.ensureArray();
    const newElems = cb(e, (v) => this.makeChild(v, v).as());
    if (e !== newElems) {
      this._children = [newElems, initial];
      this._outOfSync |= ControlChange.Value;
      this.runChange(ControlChange.Value | this.updateArrayFlags());
    }
  }

  remove(child: number | FormControl<ElemType<V>, M>): void {
    const [elems, initialElems] = this.ensureArray();
    this._children = [
      elems.filter((e, i) => i !== child && e !== child),
      initialElems,
    ];
    this.runChange(ControlChange.Value | this.updateArrayFlags());
  }

  add(
    child: ElemType<V>,
    index?: number | FormControl<ElemType<V>, M>
  ): FormControl<ElemType<V>, M> {
    if (this._value === undefined) {
      this.setValue([child] as any);
      return this.elems![0] as FormControl<ElemType<V>, M>;
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
    this._outOfSync |= ControlChange.Value;
    this.runChange(ControlChange.Value | this.updateArrayFlags());
    return newChild as any;
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
      return ControlChange.Error | this.updateValid(!Boolean(error));
    }
    return this.updateValid(!Boolean(error));
  }

  clearErrors() {
    throw "not yet clearErrors";
  }

  lookupControl(path: (string | number)[]): FormControl<any, M> {
    throw "not yet lookupControl";
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
  runChange(changed: ControlChange): FormControl<V, M> {
    if (changed) {
      if (this.freezeCount === 0) {
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
      this.runListeners(this.frozenChanges);
    }
  }

  freeze() {
    this.freezeCount++;
  }

  addChangeListener(
    listener: (control: FormControl<V, M>, change: ControlChange) => void,
    mask?: ControlChange
  ) {
    this.listeners = [
      ...this.listeners,
      [mask ? mask : ControlChange.All, listener],
    ];
  }

  removeChangeListener(
    listener: (control: FormControl<V, M>, change: ControlChange) => void
  ) {
    this.listeners = this.listeners.filter((cl) => cl[1] !== listener);
  }

  setError(error?: string | null): FormControl<V, M> {
    return this.runChange(this.updateError(error));
  }

  /**
   * Run validation listeners.
   */
  validate(): FormControl<V, M> {
    return this.runChange(ControlChange.Validate);
  }

  private makeChild(v: any, iv: any, p?: string | symbol) {
    return (this._makeChild ?? createChild)(
      v,
      iv,
      {} as any,
      ControlFlags.Valid |
        (this.flags & (ControlFlags.Touched | ControlFlags.Disabled)),
      [this.childListener],
      p
    );
  }

  ensureArray(): [
    FormControl<ElemType<V>, M>[],
    FormControl<ElemType<V>, M>[]
  ] {
    const fc = this as unknown as ControlImpl<any[], M>;
    if (!this._children) {
      const valArr = fc._value ?? [];
      const iArr = fc._initialValue ?? [];
      const mostElems = Math.max(valArr.length, iArr.length);
      const iArrElem: FormControl<ElemType<V>, M>[] = [];
      const ivArrElem: FormControl<ElemType<V>, M>[] = [];
      for (let i = 0; i < mostElems; i++) {
        const haveValue = i < valArr.length;
        const haveInitial = i < iArr.length;
        const firstValue = haveValue ? valArr[i] : iArr[i];
        const c = this.makeChild(
          firstValue,
          haveInitial ? iArr[i] : firstValue
        );
        if (haveValue) iArrElem.push(c.as());
        if (haveInitial) ivArrElem.push(c.as());
      }
      this._children = [iArrElem, ivArrElem];
      return this._children;
    }
    if (Array.isArray(this._children)) return this._children;
    throw "Not an array";
  }

  get fields():
    | FormControlFields<V, M>
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
          target: { [p: string | symbol]: FormControl<any, M> },
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
    return this._fieldsProxy!;
  }

  get value(): V {
    if (!(this._outOfSync & ControlChange.Value)) return this._value;

    if (this._children) {
      if (Array.isArray(this._children)) {
        const [elems] = this._children;
        this._value = elems.map((x) => x.value) as any;
      } else {
        const newValue = { ...this._value };
        Object.entries(this._children).forEach(([p, c]) => {
          (newValue as any)[p] = c.value;
        });
        console.log("Not sync", this._value, newValue);
        this._value = newValue;
      }
    }
    this._outOfSync &= ~ControlChange.Value;
    return this._value;
  }

  get initialValue(): V {
    if (!(this._outOfSync & ControlChange.Dirty)) return this._initialValue;

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
    this._outOfSync &= ~ControlChange.Dirty;
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
    | FormControl<ElemType<V>, M>[]
    | (undefined extends V ? undefined : never) {
    if (this._value === undefined) return undefined as any;
    return this.ensureArray()[0] as FormControl<ElemType<V>, M>[];
  }

  get element(): HTMLElement | null {
    return (this.meta as any)["element"];
  }

  set element(e: HTMLElement | null) {
    (this.meta as any)["element"] = e;
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

  private updateArrayFlags() {
    return (
      this.updateTouched(true) |
      this.updateDirty(this.isAnyChildDirty()) |
      this.updateValid(this.visitChildren((c) => c.valid))
    );
  }

  setValue(v: V, initial?: boolean): FormControl<V, M> {
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
          return this.runChange(
            (wasUndefined ? ControlChange.Value : 0) | this.updateArrayFlags()
          );
        } else {
          const childFields = this._children as unknown as {
            [k: string]: FormControl<any, M>;
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
      if (this.isEqual(this._value, v)) {
        return this.runChange(
          this.updateDirty(!this.isEqual(v, this._initialValue))
        );
      }
      this._value = v;
      return this.runChange(
        ControlChange.Value |
          this.updateDirty(!this.isEqual(this._value, this._initialValue))
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
    this.visitChildren(
      (c) => {
        c.runChange(change(c));
        return true;
      },
      true,
      true
    );
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

  markArrayClean(): void {
    throw "not yet markArrayClean";
  }

  addFields<OTHER extends { [p: string]: any }>(v: {
    [K in keyof OTHER]-?: FormControl<OTHER[K], M>;
  }): FormControl<V & OTHER> {
    this._children = { ...this._children, ...v } as any;
    return this.as();
  }

  as<NV extends V>(): FormControl<NV, M> {
    return this as unknown as FormControl<NV, M>;
  }

  subGroup<OUT extends { [k: string]: FormControl<any> }>(
    select: (fields: FormControlFields<V, M>) => OUT
  ): FormControl<{ [K in keyof OUT]: ValueTypeForControl<OUT[K]> }> {
    return groupFromControls(select(this.fields!)).as();
  }

  toObject(): V {
    return this.value;
  }
}

export type ControlCreator<V> = () => FormControl<V>;

export type ControlDefType<T> = T extends () => FormControl<infer V> ? V : T;

export interface FormControlBuilder<V, M> {
  build(value: V): FormControl<V, M>;
}

function setupValidator<V, M>(
  value: V,
  validator?: ((v: V) => string | undefined) | null
): {
  error: string | undefined;
  flags: ControlFlags;
  listeners: ChangeListener<V, M>[];
} {
  const error = validator?.(value);
  const flags = error ? 0 : ControlFlags.Valid;
  const listeners: ChangeListener<V, M>[] =
    validator === null
      ? []
      : [
          [
            ControlChange.Value | ControlChange.Validate,
            (c) => {
              c.setError(validator?.(c.value));
            },
          ],
        ];
  return { error, flags, listeners };
}

/**
 * Define a form control containing values of type V
 * @param value Initial value for control
 * @param validator An optional synchronous validator
 * @param equals An optional equality function
 */
export function control<V>(
  value: V,
  validator?: ((v: V) => string | undefined) | null,
  equals?: (a: V, b: V) => boolean
): () => FormControl<V> {
  return () => {
    const { error, flags, listeners } = setupValidator<V, BaseControlMetadata>(
      value,
      validator
    );
    return new ControlImpl<V, BaseControlMetadata>(
      value,
      value,
      error,
      {},
      flags,
      listeners
    );
  };
}

function builderFormControl(
  child: any | (() => FormControl<any>)
): FormControl<any> {
  if (typeof child === "function") {
    return child();
  }
  return control(child)();
}

function initChild<V, M>(
  c: FormControl<V, M>,
  v: V,
  iv: V,
  listeners: ChangeListener<V, M>[]
) {
  c.setValue(iv, true);
  c.setValue(v);
  listeners.forEach((l) => c.addChangeListener(l[1], l[0]));
}

export function arrayControl<CHILD>(
  child: CHILD
): () => FormControl<(CHILD extends () => FormControl<infer V> ? V : CHILD)[]> {
  return () => {
    return new ControlImpl<any[], BaseControlMetadata>(
      [],
      [],
      undefined,
      { element: null },
      ControlFlags.Valid,
      [],
      (v, iv, p, flags, listeners) => {
        const c = builderFormControl(child);
        initChild(c, v, iv, listeners);
        return c;
      }
    ) as any;
  };
}

export function arraySelectionControl<V>(
  child: FormControl<V[]>,
  getKey: (v: V) => any,
  getElemKey: (elem: FormControl<V>) => any,
  defaultValues?: V[]
): () => FormControl<V[]> {
  throw "Not yet arraySelectionControl";
}

/**
 *
 * @param children
 */
export function groupControl<DEF extends { [t: string]: any }>(
  children: DEF
): () => FormControl<{
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
    const initialFields: [string, FormControl<any>][] = builderProps.map(
      ([p, v]) => {
        const fc = v() as FormControl<any>;
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
      [],
      (v, iv, meta, flags, listeners, p) => {
        const fc = fields[p as string];
        if (fc) {
          initChild(fc, v, iv, listeners);
          return fc;
        }
        return createChild(v, iv, meta, flags, listeners);
      }
    ) as any;
  };
}

/**
 * Create a form group function which only accepts
 * valid definitions that will produce values of given type T.
 */
export function buildGroup<T>(): <
  DEF extends { [K in keyof T]: T[K] | (() => FormControl<T[K]>) }
>(
  children: DEF
) => () => FormControl<{
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
      let flags: ControlChange = change & ControlChange.Value;
      pc._outOfSync |= change & (ControlChange.Value | ControlChange.Dirty);
      if (change & ControlChange.Valid) {
        const valid =
          child.valid && (parent.valid || pc.visitChildren((c) => c.valid));
        flags |= pc.updateValid(valid);
      }
      if (change & ControlChange.Dirty) {
        const dirty = child.dirty || (parent.dirty && pc.isAnyChildDirty());
        flags |= pc.updateDirty(dirty);
      }
      if (change & ControlChange.Touched) {
        flags |= pc.updateTouched(child.touched || parent.touched);
      }
      pc.runChange(flags);
    },
  ];
}

export function groupFromControls<C extends { [k: string]: any }, M>(
  fields: C
): FormControl<{ [K in keyof C]: ValueTypeForControl<C[K]> }, Partial<M>> {
  const c = new ControlImpl<
    { [K in keyof C]: ValueTypeForControl<C[K]> },
    Partial<M>
  >({} as any, {} as any, undefined, {}, ControlFlags.Valid, [], undefined);
  c._children = fields;
  Object.values(fields).forEach((x) =>
    x.addChangeListener(c.childListener[1], c.childListener[0])
  );
  c._outOfSync = ControlChange.Value | ControlChange.Dirty;
  return c;
}

export function createControl<V, M>(
  initial: V,
  flags: ControlFlags = ControlFlags.Valid,
  meta?: M,
  error?: string,
  dontClearError?: boolean
): FormControl<V, Partial<M>> {
  return new ControlImpl<V, Partial<M>>(
    initial,
    initial,
    error,
    meta ?? {},
    flags,
    dontClearError
      ? []
      : [
          [
            ControlChange.Value | ControlChange.Validate,
            (c) => c.setError(undefined),
          ],
        ]
  );
}

function createChild<V, M>(
  value: V,
  initialValue: V,
  meta: M,
  flags: ControlFlags,
  listeners: ChangeListener<V, M>[],
  key?: string | symbol
): FormControl<V, M> {
  return new ControlImpl(
    value,
    initialValue,
    undefined,
    meta,
    flags,
    listeners
  );
}

export function validateWith<V, M = BaseControlMetadata>(
  validator: ((v: V) => string | undefined) | null
): FormControlBuilder<V, Partial<M>> {
  return {
    build(value: V): FormControl<V, Partial<M>> {
      const { error, flags, listeners } = setupValidator<V, Partial<M>>(
        value,
        validator
      );
      return new ControlImpl<V, Partial<M>>(
        value,
        value,
        error,
        {},
        flags,
        listeners
      );
    },
  };
}

export function elementsWith<V, M = BaseControlMetadata>(
  element: FormControlBuilder<V, M>,
  validator?: (v: V[]) => string | undefined
): FormControlBuilder<V[], Partial<M>> {
  return {
    build(value: V[]): FormControl<V[], Partial<M>> {
      const { error, flags, listeners } = setupValidator<V[], Partial<M>>(
        value,
        !validator ? null : validator
      );
      return undefined as any;
      // const childElems = value.map((v) => element.build(v));
      // const allValid = childElems.every((x) => x.valid);
      // const c = new ControlImpl<V[], Partial<M>>(
      //   value,
      //   value,
      //   error,
      //   {},
      //   flags & ~(allValid ? 0 : ControlFlags.Valid),
      //   listeners,
      //   (v, iv, m, flags, listeners) => {
      //     const b = element.build(iv);
      //     initChild(b, v as V, iv as V, listeners);
      //     return b as FormControl<any, Partial<M>>;
      //   }
      // );
      // c._children = [childElems, childElems];
      // childElems.forEach((x) =>
      //   x.addChangeListener(c.childListener[1], c.childListener[0])
      // );
      // return c.thisAsFC;
    },
  };
}

export function defineControl<
  V extends { [k: string]: any },
  M = BaseControlMetadata
>(
  children?: { [K in keyof V]?: FormControlBuilder<V[K], M> },
  validator?: (v: V) => string | undefined,
  meta?: Partial<M>
): FormControlBuilder<V, Partial<M>> {
  return {
    build(value: V): FormControl<V, Partial<M>> {
      const { error, flags, listeners } = setupValidator<V, Partial<M>>(
        value,
        !validator ? null : validator
      );
      const childEntries: [string, FormControl<any, Partial<M>>][] = children
        ? Object.entries(children).map(([k, b]) => [k, b.build(value[k])])
        : [];
      const allValid = childEntries.every((x) => x[1].valid);
      const childFields = Object.fromEntries(childEntries);
      return new ControlImpl<V, Partial<M>>(
        value,
        value,
        error,
        meta ?? {},
        flags & ~(allValid ? 0 : ControlFlags.Valid),
        listeners,
        (v, iv, meta, flags, listeners, p) => {
          const exField = childFields[p as string];
          if (exField) {
            initChild(exField, v, iv, listeners);
            return exField;
          }
          return createChild(v, iv, {}, flags, listeners);
        }
      );
    },
  };
}

/**
 * @deprecated Use FormControl instead
 */
export type ControlValueTypeOut<C> = C extends FormControl<infer V> ? V : never;

export type ValueTypeForControl<C> = C extends FormControl<infer V> ? V : never;

/**
 * @deprecated Use FormControl instead
 */
export type GroupControl<C> = 0 extends 1 & C
  ? FormControl<{}>
  : FormControl<{
      [K in keyof C]: ControlValueTypeOut<C[K]>;
    }>;

/**
 * @deprecated Use FormControl instead
 */
export type GroupControlFields<C> = C extends FormControl<infer V>
  ? { [K in keyof V]: FormControl<V[K]> }
  : never;

/**
 * @deprecated Use FormControl instead
 */
export type Control<V> = FormControl<V>;

export type AnyControl = FormControl<any>;

/**
 * @deprecated Use FormControl instead
 */
export type BaseControl = FormControl<any>;

/**
 * @deprecated Use FormControl instead
 */
export type ControlType<T> = T extends () => FormControl<infer V>
  ? FormControl<V>
  : never;

/**
 * @deprecated Use FormControl instead
 */
export type ArrayControl<C> = FormControl<ValueTypeForControl<C>[]>;

export type ParentControl<V> = FormControl<V>;
