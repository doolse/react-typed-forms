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

export type FormControlFields<V, M> = V extends object
  ? { [K in keyof V]-?: FormControl<V[K], M> }
  : never;

type FormControlElems<V, M> = V extends Array<infer E>
  ? FormControl<E, M>[]
  : never;

export type ControlValueTypeOut<C> = C extends FormControl<infer V> ? V : never;
export type ValueTypeForControl<C> = C extends FormControl<infer V> ? V : never;
export type GroupControl<C> = FormControl<{
  [K in keyof C]: ControlValueTypeOut<C[K]>;
}>;

export type ArrayControl<C> = FormControl<ControlValueTypeOut<C>>;

export type Control<V> = FormControl<V>;

export interface FormControl<V, M = BaseControlMetadata> {
  readonly uniqueId: number;
  readonly stateVersion: number;
  setTouched(showValidation: boolean): void;
  markAsClean(): void;
  readonly value: V;
  readonly error?: string;
  readonly valid: boolean;
  readonly dirty: boolean;
  readonly disabled: boolean;
  readonly touched: boolean;
  setValue(v: V, initial?: boolean): FormControl<V, M>;
  groupedChanges(run: () => void): FormControl<V, M>;
  unfreeze(notify?: boolean): void;
  freeze(notify?: boolean): void;
  addChangeListener(
    listener: (control: FormControl<V, M>, change: ControlChange) => void,
    mask?: ControlChange
  ): void;
  removeChangeListener(
    listener: (control: FormControl<V, M>, change: ControlChange) => void
  ): void;
  element: M extends BaseControlMetadata ? M["element"] : never;
  setError(error?: string | null): FormControl<V, M>;
  validate(): FormControl<V, M>;
  readonly fields: undefined extends V
    ? FormControlFields<V, M> | undefined
    : FormControlFields<V, M>;
  toObject(): V;
  setDisabled(disabled: boolean): FormControl<V, M>;
  readonly initialValue: V;

  // array
  readonly elems: undefined extends V
    ? FormControlElems<V, M> | undefined
    : FormControlElems<V, M>;
  update(f: (orig: FormControlElems<V, M>) => FormControlElems<V, M>): void;
  remove(
    child: V extends Array<infer A> ? number | FormControl<A, M> : never
  ): void;
  add(child: V extends Array<infer A> ? A : never, index?: number): void;
}

class ControlImpl<V, M> implements FormControl<V, M> {
  uniqueId = ++controlCount;
  _outOfSync: ControlChange = 0;

  private _fieldsProxy?: V extends object
    ? { [K in keyof V]-?: FormControl<V[K], M> }
    : never;

  _children?:
    | { [k: string | symbol]: FormControl<any, M> }
    | [FormControl<any, M>[], FormControl<any, M>[]];

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
    return (this._makeChild ?? createControl)(
      v,
      iv,
      {} as any,
      ControlFlags.Valid |
        (this.flags & (ControlFlags.Touched | ControlFlags.Disabled)),
      [this.childListener],
      p
    );
  }

  ensureArray(): [FormControl<any, M>[], FormControl<any, M>[]] {
    const fc = this as unknown as ControlImpl<any[], M>;
    if (!this._children) {
      const valArr = fc._value ?? [];
      const iArr = fc._initialValue ?? [];
      const mostElems = Math.max(valArr.length, iArr.length);
      const iArrElem: FormControl<any, M>[] = [];
      const ivArrElem: FormControl<any, M>[] = [];
      for (let i = 0; i < mostElems; i++) {
        const haveValue = i < valArr.length;
        const haveInitial = i < iArr.length;
        const firstValue = haveValue ? valArr[i] : iArr[i];
        const c = this.makeChild(
          firstValue,
          haveInitial ? iArr[i] : firstValue
        );
        if (haveValue) iArrElem.push(c);
        if (haveInitial) ivArrElem.push(c);
      }
      this._children = [iArrElem, ivArrElem];
      return this._children;
    }
    if (Array.isArray(this._children)) return this._children;
    throw "Not an array";
  }

  get fields(): V extends object
    ? { [K in keyof V]-?: FormControl<V[K], M> }
    : never {
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

  get elems(): undefined extends V
    ? FormControlElems<V, M> | undefined
    : FormControlElems<V, M> {
    if (this._value === undefined) return undefined as any;
    return this.ensureArray()[0] as FormControlElems<V, M>;
  }

  get element(): M extends BaseControlMetadata ? M["element"] : never {
    return (this.meta as any)["element"];
  }

  set element(e: M extends BaseControlMetadata ? M["element"] : never) {
    (this.meta as any)["element"] = e;
  }

  add(child: V extends Array<infer A> ? A : never, index?: number): void {
    if (this._value === undefined) {
      this.setValue([child] as any);
      return;
    }
    const [elems, initialElems] = this.ensureArray();
    const newElems = [...elems];
    const newChild = this.makeChild(child, child);

    if (index !== undefined) {
      newElems.splice(index, 0, newChild);
    } else {
      newElems.push(newChild);
    }
    this._children = [newElems, initialElems];
    this._value = [] as any;
    this._outOfSync |= ControlChange.Value;
    this.runChange(ControlChange.Value | this.updateArrayFlags());
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

  remove(
    child: V extends Array<infer A> ? number | FormControl<A, M> : never
  ): void {
    const [elems, initialElems] = this.ensureArray();
    this._children = [
      elems.filter((e, i) => i !== child && e !== child),
      initialElems,
    ];
    this.runChange(ControlChange.Value | this.updateArrayFlags());
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
              : this.makeChild(x, x)
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

  toObject(): V {
    return this.value;
  }

  update(f: (orig: FormControlElems<V, M>) => FormControlElems<V, M>): void {
    const [e, initial] = this.ensureArray();
    const newElems = f(e as FormControlElems<V, M>);
    if (e !== newElems) {
      this._children = [newElems, initial];
      this._outOfSync |= ControlChange.Value;
      this.runChange(ControlChange.Value | this.updateArrayFlags());
    }
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
}

export type ControlCreator<V> = () => FormControl<V>;

export type ControlDefType<T> = T extends () => FormControl<infer V> ? V : T;

export interface FormControlBuilder<V, M> {
  build(value: V): FormControl<V, M>;
}

// export function buildGroup<V>(): (group: any) => () => FormControl<V> {
//   return undefined as any;
// }
//
// export function groupControl<V>(group: V): () => FormControl<V> {
//   return undefined as any;
// }

function setupValidator<V>(
  value: V,
  validator?: ((v: V) => string | undefined) | null
): {
  error: string | undefined;
  flags: ControlFlags;
  listeners: ChangeListener<V, BaseControlMetadata>[];
} {
  const error = validator?.(value);
  const flags = error ? 0 : ControlFlags.Valid;
  const listeners: ChangeListener<V, BaseControlMetadata>[] =
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
    const { error, flags, listeners } = setupValidator(value, validator);
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

function initChild(
  c: FormControl<any>,
  v: any,
  iv: any,
  listeners: ChangeListener<any, BaseControlMetadata>[]
) {
  c.setValue(iv, true);
  c.setValue(v);
  listeners.forEach((l) => c.addChangeListener(l[1], l[0]));
}

export function arrayControl<CHILD>(
  child: CHILD
): () => FormControl<ControlDefType<CHILD>[]> {
  return () => {
    return new ControlImpl<ControlDefType<CHILD>[], BaseControlMetadata>(
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
    );
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
        return createControl(v, iv, meta, flags, listeners);
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
  parent: FormControl<V, M>
): ChangeListener<any, M> {
  const pc = parent as ControlImpl<V, M>;

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

export function groupFromControls<C extends { [k: string]: FormControl<any> }>(
  fields: C
): FormControl<{ [K in keyof C]: ControlValueTypeOut<C[K]> }> {
  const c = new ControlImpl<
    { [K in keyof C]: ControlValueTypeOut<C[K]> },
    BaseControlMetadata
  >(
    {} as any,
    {} as any,
    undefined,
    { element: null },
    ControlFlags.Valid,
    [],
    undefined
  );
  c._children = fields;
  Object.values(fields).forEach((x) =>
    x.addChangeListener(c.childListener[1], c.childListener[0])
  );
  c._outOfSync = ControlChange.Value | ControlChange.Dirty;
  return c;
}

export function createControl<V, M>(
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
      const { error, flags, listeners } = setupValidator(value, validator);
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
      const { error, flags, listeners } = setupValidator(
        value,
        !validator ? null : validator
      );
      const childElems = value.map((v) => element.build(v));
      const allValid = childElems.every((x) => x.valid);
      const c = new ControlImpl<V[], Partial<M>>(
        value,
        value,
        error,
        {},
        flags & ~(allValid ? 0 : ControlFlags.Valid),
        listeners,
        (v, iv, m, flags, listeners) => {
          const b = element.build(iv);
          initChild(b, v, iv, listeners);
          return b;
        }
      );
      c._children = [childElems, childElems];
      childElems.forEach((x) =>
        x.addChangeListener(c.childListener[1], c.childListener[0])
      );
      return c;
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
      const { error, flags, listeners } = setupValidator(
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
          return createControl(v, iv, {}, flags, listeners);
        }
      );
    },
  };
}
