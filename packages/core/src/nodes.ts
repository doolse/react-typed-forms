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

type FormControlFields<V> = V extends object
  ? { [K in keyof V]-?: FormControl<V[K]> }
  : never;

type FormControlElems<V, M> = V extends Array<infer E>
  ? FormControl<E, M>[]
  : never;

export type ControlValueTypeOut<C> = C extends FormControl<infer V> ? V : never;
export type ValueTypeForControl<C> = C extends FormControl<infer V> ? V : never;
export type Control<V> = FormControl<V>;

export type GroupControl<C> = FormControl<{
  [K in keyof C]: ControlValueTypeOut<C[K]>;
}>;

export type ArrayControl<C> = FormControl<ControlValueTypeOut<C>>;

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
    ? FormControlFields<V> | undefined
    : FormControlFields<V>;
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

interface ChildBuilder<V, S> {}

export class ControlImpl<V, M> implements FormControl<V, M> {
  uniqueId = ++controlCount;
  outOfSync: ControlChange = 0;

  private _fieldsProxy?: V extends object
    ? { [K in keyof V]-?: FormControl<V[K]> }
    : never;
  
  private _children?:
      | { [k: string | symbol]: FormControl<any, M> }
      | [FormControl<any, M>[], FormControl<any, M>[]]
  
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
    private _childListener?: ChangeListener<any, M>
  ) {
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
    return (this._makeChild ?? genericMakeChild)(
      v,
      iv,
      this.meta,
      ControlFlags.Valid |
        (this.flags & (ControlFlags.Touched | ControlFlags.Disabled)),
      [this.childListener],
      p
    );
  }

  get fields(): V extends object
    ? { [K in keyof V]-?: FormControl<V[K]> }
    : never {
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
          console.log("Making proxy for", p);
          const v = (t.value as any)[p];
          const iv = (t.initialValue as any)[p];
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
    if (!(this.outOfSync & ControlChange.Value)) return this._value;

    if (this._children) {
      if (Array.isArray(this._children)) {
        this._value = this._children.map((x) => x.value) as any;
      } else {
        const newValue = { ...this._value };
        Object.entries(this._children).forEach(([p, c]) => {
          (newValue as any)[p] = c.value;
        });
        console.log("Not sync", this._value, newValue);
        this._value = newValue;
      }
    }
    this.outOfSync &= ~ControlChange.Value;
    return this._value;
  }

  get initialValue(): V {
    if (!(this.outOfSync & ControlChange.Dirty)) return this._initialValue;

    if (this._children) {
      if (Array.isArray(this._children)) {
        throw "Out of sync array";
      } else {
        const newValue = { ...this._initialValue };
        Object.entries(this._children).forEach(([p, c]) => {
          (newValue as any)[p] = c.initialValue;
        });
        this._initialValue = newValue;
      }
    }
    this.outOfSync &= ~ControlChange.Dirty;
    return this._initialValue;
  }

  markAsClean(): void {
    if (!this._children) {
      this._value = this._initialValue;
      this.runChange(this.updateDirty(false));
      return;
    }
    if (Array.isArray(this._children)) {
      throw "Marking array as clean";
    } else {
      throw "Marking group as clean";
    }
  }

  get elems(): undefined extends V
    ? FormControlElems<V, M> | undefined
    : FormControlElems<V, M> {
    if (!this._children) {
      const childValues = this._value as unknown as any[];
      const initialValues = this._initialValue as unknown as any[];
      this._children = childValues.map((x, i) =>
        this.makeChild(x, i >= initialValues.length ? x : initialValues[i])
      );
    }
    return this._children as any;
  }

  get element(): M extends BaseControlMetadata ? M["element"] : never {
    return (this.meta as any)["element"];
  }

  set element(e: M extends BaseControlMetadata ? M["element"] : never) {
    (this.meta as any)["element"] = e;
  }

  add(child: V extends Array<infer A> ? A : never, index?: number): void {
    const e = [...this.elems!] as FormControl<any, M>[];
    const newChild = this.makeChild(child, child);

    if (index !== undefined) {
      e.splice(index, 0, newChild);
    } else {
      e.push(newChild);
    }
    this._children = e;
    this.runChange(ControlChange.Value);
  }

  isAnyChildDirty(): boolean {
    if (Array.isArray(this._initialValue) &&)
    { 
    }
    return this.getChildControls().some((x) => x.dirty);
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
    const e = this.elems!;
    this._children = e.filter((e, i) => i !== child && e !== child);
    this.runChange(ControlChange.Value | this.updateArrayFlags());
  }

  setValue(v: V, initial?: boolean): FormControl<V, M> {
    if (v === undefined) {
      throw "not yet, setValue(undefined)";
    }
    if (this._children) {
      this.groupedChanges(() => {
        if (Array.isArray(this._children)) {
          throw "not yet, setting arrayValue";
          // console.log("setting array value");
        } else {
          Object.entries(this._children!).forEach(([p, fc]) => {
            console.log("child", p, v);
            fc.setValue((v as any)?.[p], initial);
          });
        }
        // TODO what about when fields dont have form controls yet?
      });
      return this;
    } else {
      if (this._value === v) {
        return this;
      }
      this._value = v;
      return this.runChange(ControlChange.Value);
    }
  }

  toObject(): V {
    return this.value;
  }

  update(f: (orig: FormControlElems<V, M>) => FormControlElems<V, M>): void {}

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
    return c ? (Array.isArray(c) ? c : (Object.values(c) as any)) : [];
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
  build(): FormControl<V, M>;
}

// export function buildGroup<V>(): (group: any) => () => FormControl<V> {
//   return undefined as any;
// }
//
// export function groupControl<V>(group: V): () => FormControl<V> {
//   return undefined as any;
// }

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
    return new ControlImpl<V, BaseControlMetadata>(
      value,
      value,
      error,
      { element: null },
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
        c.setValue(iv, true);
        c.setValue(v);
        listeners.forEach((l) => c.addChangeListener(l[1], l[0]));
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
    return new ControlImpl(
      v,
      v,
      undefined,
      {},
      allValid ? ControlFlags.Valid : 0,
      [],
      undefined,
      Object.fromEntries(initialFields)
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
      pc.outOfSync |= change & (ControlChange.Value | ControlChange.Dirty);
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
    undefined,
    fields
  );
  c.outOfSync = ControlChange.Value | ControlChange.Dirty;
  return c;
}

function genericMakeChild<M>(
  value: any,
  initialValue: any,
  parentMeta: M,
  flags: ControlFlags,
  listeners: ChangeListener<any, M>[],
  key?: string | symbol
): FormControl<any, M> {
  return new ControlImpl(
    value,
    initialValue,
    undefined,
    { ...parentMeta },
    flags,
    listeners
  );
}
