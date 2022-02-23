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
  Freeze = 128,
}

export type BaseControl = Control<any>;

export type AnyControl =
  | FormControl<any>
  | ArrayControl<any>
  | ArraySelectionControl<any>
  | GroupControl<any>;

export type ChangeListener<C extends BaseControl> = [
  ControlChange,
  (control: C, cb: ControlChange) => void
];

let controlCount = 0;

export abstract class Control<V> {
  flags: ControlFlags = ControlFlags.Valid;
  error: string | undefined | null;
  uniqueId = ++controlCount;
  element: HTMLElement | null = null;

  /**
   * @internal
   */
  listeners: ChangeListener<any>[] = [];
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
  abstract visitChildren(
    visit: (c: BaseControl) => boolean,
    doSelf?: boolean,
    recurse?: boolean
  ): boolean;

  abstract setTouched(showValidation: boolean): void;
  abstract markAsClean(): void;
  abstract toValue(): V;

  /**
   * @internal
   */
  updateError(error?: string | null): ControlChange {
    if (this.error !== error) {
      this.error = error;
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
  runChange(changed: ControlChange): this {
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
    this.freeze(true);
    run();
    this.unfreeze(true);
    return this;
  }

  unfreeze(notify?: boolean) {
    this.freezeCount--;
    if (this.freezeCount === 0) {
      this.runListeners(
        this.frozenChanges | (notify ? ControlChange.Freeze : 0)
      );
    }
  }

  freeze(notify?: boolean) {
    this.freezeCount++;
    if (notify && this.freezeCount === 1) {
      this.listeners.forEach(([m, cb]) => {
        if ((m & ControlChange.Freeze) !== 0) cb(this, ControlChange.Freeze);
      });
    }
  }

  addChangeListener(
    listener: (control: this, change: ControlChange) => void,
    mask?: ControlChange
  ) {
    this.listeners = [
      ...this.listeners,
      [mask ? mask : ControlChange.All, listener],
    ];
  }

  removeChangeListener(
    listener: (control: this, change: ControlChange) => void
  ) {
    this.listeners = this.listeners.filter((cl) => cl[1] !== listener);
  }

  setError(error?: string | null): this {
    return this.runChange(this.updateError(error));
  }

  /**
   * Run validation listeners.
   */
  validate(): this {
    return this.runChange(ControlChange.Validate);
  }
}

function setValueUnsafe(ctrl: BaseControl, v: any, initial?: boolean) {
  (ctrl as any).setValue(v, initial);
}

type IsOptionalField<K, C> = C extends FormControl<infer V>
  ? undefined extends V
    ? K
    : never
  : never;

type IsRequiredField<K, C> = C extends FormControl<infer V>
  ? undefined extends V
    ? never
    : K
  : K;

export type ValueTypeForControl<C> = C extends GroupControl<infer F>
  ? { [K in keyof F as IsRequiredField<K, F[K]>]: ValueTypeForControl<F[K]> } &
      { [K in keyof F as IsOptionalField<K, F[K]>]?: ValueTypeForControl<F[K]> }
  : C extends FormControl<infer V>
  ? V
  : C extends ArrayControl<infer AC>
  ? ValueTypeForControl<AC>[]
  : C extends ArraySelectionControl<infer AC>
  ? ValueTypeForControl<AC>[]
  : never;

export type ControlValueTypeOut<C> = C extends GroupControl<infer F>
  ? { [K in keyof F]: ControlValueTypeOut<F[K]> }
  : C extends FormControl<infer V>
  ? V
  : C extends ArrayControl<infer AC>
  ? ControlValueTypeOut<AC>[]
  : C extends ArraySelectionControl<infer AC>
  ? ControlValueTypeOut<AC>[]
  : never;

export class FormControl<V> extends Control<V> {
  initialValue: V;
  equals: (a: any, b: any) => boolean;

  constructor(
    public value: V,
    validator?: ((v: V) => string | undefined | null) | null,
    equals?: (a: V, b: V) => boolean
  ) {
    super();
    this.initialValue = value;
    this.equals = equals ?? ((a: V, b: V) => a === b);
    if (validator !== null) {
      this.setError(validator?.(value));
      this.addChangeListener(() => {
        const error = validator?.(this.value);
        this.runChange(this.updateError(error));
      }, ControlChange.Value | ControlChange.Validate);
    }
  }

  toValue(): any {
    return this.value;
  }

  /**
   * Set the value for this control and
   * update the dirty flag if changed.
   * @param value The value to set
   * @param initial If true the dirty flag is reset
   * and a copy of the value is kept to check for dirtiness
   * on any future updates.
   */
  setValue(value: V, initial?: boolean): this {
    if (!this.equals(value, this.value)) {
      this.value = value;
      if (initial) {
        this.initialValue = value;
      }
      this.runChange(
        ControlChange.Value |
          this.updateDirty(!this.equals(value, this.initialValue))
      );
    } else if (initial) {
      this.initialValue = value;
      this.runChange(this.updateDirty(false));
    }
    return this;
  }

  markAsClean() {
    this.initialValue = this.value;
    this.runChange(this.updateDirty(false));
  }

  visitChildren(
    visit: (c: BaseControl) => boolean,
    doSelf?: boolean,
    recurse?: boolean
  ): boolean {
    return !doSelf || visit(this);
  }

  /**
   * Set the disabled flag.
   * @param disabled
   */
  setDisabled(disabled: boolean): this {
    this.runChange(this.updateDisabled(disabled));
    return this;
  }

  /**
   * Set the touched flag.
   * @param touched
   */
  setTouched(touched: boolean): this {
    this.runChange(this.updateTouched(touched));
    return this;
  }
}

export abstract class ParentControl<V> extends Control<V> {
  parentListener: ChangeListener<BaseControl>;

  constructor(
    mkListener: (parent: ParentControl<V>) => ChangeListener<BaseControl>
  ) {
    super();
    this.parentListener = mkListener(this);
  }

  /**
   * @internal
   */
  protected updateAll(change: (c: BaseControl) => ControlChange) {
    this.visitChildren(
      (c) => {
        c.runChange(change(c));
        return true;
      },
      true,
      true
    );
  }

  public isAnyChildDirty(): boolean {
    return !this.visitChildren((c) => !c.dirty);
  }

  /**
   * @internal
   */
  protected controlFromDef<N extends BaseControl>(create: () => N): N {
    const l = this.parentListener;
    let child = create();
    child.addChangeListener(l[1], l[0]);
    l[1](child, ControlChange.All);
    return child;
  }

  /**
   * Set the disabled flag on this and all children.
   * @param disabled
   */
  setDisabled(disabled: boolean): this {
    this.updateAll((c) => c.updateDisabled(disabled));
    return this;
  }

  /**
   * Set the touched flag on this and any children.
   * @param touched
   */
  setTouched(touched: boolean): this {
    this.updateAll((c) => c.updateTouched(touched));
    return this;
  }

  /**
   * Run validation listeners for this and any children.
   */
  validate(): this {
    this.updateAll(() => ControlChange.Validate);
    return this;
  }

  /**
   * Clear all error messages and mark controls as valid.
   */
  clearErrors(): this {
    this.updateAll((c) => c.updateError(undefined));
    return this;
  }

  /**
   * Lookup a child control give an array of control path elements.
   * A path element is either a string property name for GroupControl
   * or an index number for ArrayControl.
   * @param path
   */
  lookupControl(path: (string | number)[]): BaseControl | null {
    let base = this;
    let index = 0;
    while (index < path.length && base) {
      const childId = path[index];
      if (base instanceof GroupControl) {
        base = base.fields[childId];
      } else if (base instanceof ArrayControl && typeof childId == "number") {
        base = base.elems[childId];
      } else if (
        base instanceof ArraySelectionControl &&
        typeof childId == "number"
      ) {
        base = base.elems.filter((x) => x.fields.selected.value)[childId]
          ?.fields.value;
      } else {
        return null;
      }
      index++;
    }
    return base;
  }
}

export type FormControlFields<R> = { [K in keyof R]-?: FormControl<R[K]> };

export class ArrayControl<FIELD extends Control<any>> extends ParentControl<
  ControlValueTypeOut<FIELD>[]
> {
  elems: FIELD[] = [];
  initialFields: FIELD[] = [];
  findExisting: (
    elems: FIELD[],
    i: number,
    v: ValueTypeForControl<FIELD>,
    initial: boolean
  ) => FIELD | undefined;

  constructor(
    private childDefinition: () => FIELD,
    parentListener?: (
      parent: ParentControl<ControlValueTypeOut<FIELD>[]>
    ) => ChangeListener<BaseControl>,
    findExisting?: (
      elems: FIELD[],
      i: number,
      v: ValueTypeForControl<FIELD>,
      initial: boolean
    ) => FIELD | undefined
  ) {
    super(parentListener ?? createParentListener);
    this.findExisting =
      findExisting ??
      ((elems1, i) => (i < elems1.length ? elems1[i] : undefined));
  }

  /**
   * Set the child values. Underlying controls will be
   * added/deleted if the size of the array changes.
   * @param value The values to set on child controls
   * @param initial If true reset the dirty flag
   */
  setValue(value: ValueTypeForControl<FIELD>[], initial?: boolean): this {
    value = value ?? [];
    return this.groupedChanges(() => {
      let flags: ControlChange = 0;
      const childElems = value.map((v, i) => {
        const existing = this.findExisting(this.elems, i, v, Boolean(initial));
        if (!existing) {
          flags |= ControlChange.Value;
          const newControl = this.controlFromDef(this.childDefinition);
          setValueUnsafe(newControl, v, true);
          return newControl;
        } else {
          if (i >= this.elems.length || this.elems[i] !== existing) {
            flags |= ControlChange.Value;
          }
          setValueUnsafe(existing, v, initial);
          return existing;
        }
      });
      this.elems = childElems;
      if (initial) {
        this.initialFields = childElems;
        flags |= this.updateDirty(false);
      } else {
        flags |= this.updateDirty(this.isAnyChildDirty());
      }
      this.runChange(flags);
    });
  }

  markAsClean() {
    return this.groupedChanges(() => {
      this.runChange(this.updateDirty(false));
      this.initialFields = this.elems;
      this.elems.forEach((c) => c.markAsClean());
    });
  }

  markArrayClean() {
    this.initialFields = this.elems;
    this.runChange(this.updateDirty(this.isAnyChildDirty()));
  }

  toArray(): ControlValueTypeOut<FIELD>[] {
    return this.elems.map((e) => e.toValue());
  }

  toValue() {
    return this.toArray();
  }

  visitChildren(
    visit: (c: BaseControl) => boolean,
    doSelf?: boolean,
    recurse?: boolean
  ): boolean {
    if (doSelf && !visit(this)) {
      return false;
    }
    if (!this.elems.every(visit)) {
      return false;
    }
    if (recurse) {
      return this.elems.every((c) => c.visitChildren(visit, false, true));
    }
    return true;
  }

  /**
   * Add a new element to the array
   * @param index Optional insertion index
   */
  add(index?: number): FIELD {
    const newCtrl = this.controlFromDef(this.childDefinition);
    this.elems = [...this.elems];
    if (index !== undefined) {
      this.elems.splice(index, 0, newCtrl);
    } else {
      this.elems.push(newCtrl);
    }
    this.runChange(ControlChange.Value | this.updateArrayFlags());
    return newCtrl;
  }

  /**
   * Update the form elements and check flags.
   * @param f A function which takes the array of form elements and a function which
   * can create new elements and returns a new array.
   */
  update(
    f: (
      fields: FIELD[],
      makeChild: (value: ValueTypeForControl<FIELD>) => FIELD
    ) => FIELD[]
  ): void {
    const newElems = f(this.elems, (v) => {
      const ctrl = this.controlFromDef(this.childDefinition);
      setValueUnsafe(ctrl, v);
      return ctrl;
    });
    if (this.elems !== newElems) {
      this.elems = newElems;
      this.runChange(ControlChange.Value | this.updateArrayFlags());
    }
  }

  /**
   * Remove an element in the array by index
   * @param index The index of the form element to remove
   */
  remove(index: number): this {
    this.elems = this.elems.filter((e, i) => i !== index);
    return this.runChange(ControlChange.Value | this.updateArrayFlags());
  }

  isAnyChildDirty(): boolean {
    const elems = this.elems;
    const initial = this.initialFields;
    if (elems === initial) return super.isAnyChildDirty();
    if (elems.length !== initial.length) {
      return true;
    }
    return elems.some((v, i) => v !== initial[i] || v.dirty);
  }

  private updateArrayFlags() {
    return (
      this.updateTouched(true) |
      this.updateDirty(this.isAnyChildDirty()) |
      this.updateValid(this.visitChildren((c) => c.valid))
    );
  }
}

export type SelectionGroup<ELEM extends AnyControl> = GroupControl<{
  selected: FormControl<boolean>;
  value: ELEM;
}>;

export class ArraySelectionControl<
  FIELD extends AnyControl
> extends ParentControl<ControlValueTypeOut<FIELD>[]> {
  underlying: ArrayControl<SelectionGroup<FIELD>>;
  defaultValues: ValueTypeForControl<FIELD>[];

  get elems(): SelectionGroup<FIELD>[] {
    return this.underlying.elems;
  }

  constructor(
    childDefinition: () => FIELD,
    private getKey: (v: ValueTypeForControl<FIELD>) => any,
    private getElemKey: (elem: FIELD) => any,
    defaultValues?: ValueTypeForControl<FIELD>[]
  ) {
    super(createParentListener);
    this.defaultValues = defaultValues ?? [];
    const makeSelectionGroup = () =>
      new GroupControl(
        {
          selected: new FormControl(false),
          value: childDefinition(),
        },
        (p) => selectionGroupParentListener(p as SelectionGroup<FIELD>)
      );
    this.underlying = new ArrayControl<SelectionGroup<FIELD>>(
      makeSelectionGroup,
      (p) => this.parentListener,
      (e, i, v, initial) => {
        const key = getKey((v as any).value);
        const existing = e.find((x) => getElemKey(x.fields.value) === key);
        if (existing || initial) return existing;
        const newControl = this.controlFromDef(makeSelectionGroup);
        setValueUnsafe(
          newControl,
          { selected: false, value: (v as any).value },
          true
        );
        return newControl;
      }
    );
  }

  add(selected?: boolean) {
    const c = this.underlying.add();
    c.fields.selected.setValue(selected ?? true);
    return c;
  }

  setDefaultValues(defaults: ValueTypeForControl<FIELD>[]): this {
    this.defaultValues = defaults;
    return this;
  }

  markAsClean(): void {
    this.underlying.markAsClean();
  }

  setValue(vals: ValueTypeForControl<FIELD>[], initial?: boolean): this {
    if (initial) {
      const fullValues = this.defaultValues.map((x) => ({
        selected: false,
        value: x,
      }));
      vals.forEach((v) => {
        const existing = fullValues.find(
          (x) => this.getKey(x.value) === this.getKey(v)
        );
        if (existing) {
          existing.selected = true;
          existing.value = v;
        } else {
          fullValues.push({ selected: true, value: v });
        }
      });
      this.underlying.setValue(fullValues, true);
    } else {
      const unselected = this.elems.filter((x) =>
        vals.every(
          (newVal) => this.getElemKey(x.fields.value) !== this.getKey(newVal)
        )
      );
      this.underlying.setValue([
        ...vals.map((v) => ({ selected: true, value: v })),
        ...unselected.map((f) => ({
          selected: false,
          value: f.fields.value.toValue(),
        })),
      ]);
    }
    return this;
  }

  toArray(): ControlValueTypeOut<FIELD>[] {
    const res: ControlValueTypeOut<FIELD>[] = [];
    this.underlying.elems.forEach((g) => {
      if (g.fields.selected.value) {
        res.push(g.fields.value.toValue());
      }
    });
    return res;
  }

  toValue(): any {
    return this.toArray();
  }

  visitChildren(
    visit: (c: BaseControl) => boolean,
    doSelf?: boolean,
    recurse?: boolean
  ): boolean {
    if (doSelf && !visit(this)) {
      return false;
    }
    return this.underlying.visitChildren(visit, doSelf, recurse);
  }
}

type GroupFields = {
  [k: string]: AnyControl;
};

export class GroupControl<FIELDS extends GroupFields> extends ParentControl<
  { [K in keyof FIELDS]: ControlValueTypeOut<FIELDS[K]> }
> {
  fields: FIELDS;

  constructor(
    children: FIELDS,
    parentListener?: (parent: ParentControl<any>) => ChangeListener<BaseControl>
  ) {
    super(parentListener ?? createParentListener);
    this.fields = {} as FIELDS;
    this.addFields(children);
  }

  addFields<MORE extends GroupFields>(
    moreChildren: MORE
  ): GroupControl<FIELDS & MORE> {
    this.fields = { ...this.fields, ...moreChildren };
    const l = this.parentListener;
    for (const c in moreChildren) {
      moreChildren[c].addChangeListener(l[1], l[0]);
    }
    this.setFlag(
      ControlFlags.Valid,
      this.visitChildren((c) => c.valid)
    );
    return this as any;
  }

  subGroup<OTHER extends GroupFields>(
    selectFields: (f: FIELDS) => OTHER
  ): GroupControl<OTHER> {
    const subGroup = new GroupControl<OTHER>(selectFields(this.fields));
    this.addChangeListener((c) => {
      c.freezeCount === 0 ? subGroup.unfreeze() : subGroup.freeze();
    }, ControlChange.Freeze);
    subGroup.addChangeListener((c) => {
      c.freezeCount === 0 ? this.unfreeze() : this.freeze();
    }, ControlChange.Freeze);
    return subGroup;
  }

  visitChildren(
    visit: (c: BaseControl) => boolean,
    doSelf?: boolean,
    recurse?: boolean
  ): boolean {
    if (doSelf && !visit(this)) {
      return false;
    }
    const fields = this.fields;
    for (const k in fields) {
      if (!visit(fields[k])) {
        return false;
      }
      if (recurse && !fields[k].visitChildren(visit, false, true)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Set the value of all child controls.
   * If the child type contains `undefined` the fields is optional.
   * @param value The value for all child controls
   * @param initial If true reset the dirty flag
   */
  setValue(value: ValueTypeForControl<this>, initial?: boolean): this {
    value = value ?? {};
    return this.groupedChanges(() => {
      const fields = this.fields;
      for (const k in fields) {
        setValueUnsafe(fields[k], (value as any)[k], initial);
      }
    });
  }

  markAsClean() {
    return this.groupedChanges(() => {
      this.runChange(this.updateDirty(false));
      const fields = this.fields;
      for (const k in fields) {
        fields[k].markAsClean();
      }
    });
  }

  toObject(): { [K in keyof FIELDS]: ControlValueTypeOut<FIELDS[K]> } {
    const rec: Record<string, any> = {};
    for (const k in this.fields) {
      const bctrl = this.fields[k];
      rec[k] = bctrl.toValue();
    }
    return rec as any;
  }

  toValue() {
    return this.toObject();
  }
}

type ControlDefType<T> = T extends ControlCreator<infer X> ? X : FormControl<T>;

export type ControlCreator<V extends AnyControl> = () => V;

export type AllowedDefinition<V> = V | (() => Control<V>);

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
  return () => new FormControl(value, validator, equals);
}

function makeCreator(v: any): ControlCreator<any> {
  if (typeof v === "function") {
    return v;
  }
  return () => new FormControl(v);
}

export function arrayControl<CHILD>(
  child: CHILD
): () => ArrayControl<ControlDefType<CHILD>> {
  return () => new ArrayControl(makeCreator(child));
}

export function arraySelectionControl<CHILD>(
  child: CHILD,
  getKey: (v: ValueTypeForControl<ControlDefType<CHILD>>) => any,
  getElemKey: (elem: ControlDefType<CHILD>) => any,
  defaultValues?: ValueTypeForControl<ControlDefType<CHILD>>[]
): () => ArraySelectionControl<ControlDefType<CHILD>> {
  return () =>
    new ArraySelectionControl(
      makeCreator(child),
      getKey,
      getElemKey,
      defaultValues
    );
}

/**
 *
 * @param children
 */
export function groupControl<DEF extends { [t: string]: any }>(
  children: DEF
): () => GroupControl<
  {
    [K in keyof DEF]: ControlDefType<DEF[K]>;
  }
> {
  return () => {
    const fields: any = {};
    for (const k in children) {
      fields[k] = makeCreator(children[k])();
    }
    return new GroupControl(fields);
  };
}

type FieldType<T, K> = K extends keyof Exclude<T, undefined>
  ? Exclude<T, undefined>[K]
  : never;

type Correlate<V, D> = D extends FormControl<any>
  ? FormControl<V>
  : D extends GroupControl<infer FIELDS>
  ? GroupControl<
      {
        [CK in keyof FIELDS]: Correlate<FieldType<V, CK>, FIELDS[CK]>;
      }
    >
  : D;

/**
 * Create a form group function which only accepts
 * valid definitions that will produce values of given type T.
 */
export function buildGroup<T>(): <
  DEF extends { [K in keyof T]-?: AllowedDefinition<T[K]> }
>(
  children: DEF
) => () => Correlate<
  T,
  GroupControl<
    {
      [K in keyof DEF]: ControlDefType<DEF[K]>;
    }
  >
> {
  return groupControl as any;
}

export type ControlType<T extends ControlCreator<any>> = ReturnType<T>;

export type GroupControlFields<T> = T extends GroupControl<infer FIELDS>
  ? FIELDS
  : never;

/**
 * @internal
 */
function createParentListener(
  parent: ParentControl<any>
): ChangeListener<BaseControl> {
  return [
    ControlChange.Value |
      ControlChange.Valid |
      ControlChange.Touched |
      ControlChange.Dirty,
    (child, change) => {
      let flags: ControlChange = change & ControlChange.Value;
      if (change & ControlChange.Valid) {
        const valid =
          child.valid && (parent.valid || parent.visitChildren((c) => c.valid));
        flags |= parent.updateValid(valid);
      }
      if (change & ControlChange.Dirty) {
        const dirty = child.dirty || (parent.dirty && parent.isAnyChildDirty());
        flags |= parent.updateDirty(dirty);
      }
      if (change & ControlChange.Touched) {
        flags |= parent.updateTouched(child.touched || parent.touched);
      }
      parent.runChange(flags);
    },
  ];
}

function selectionGroupParentListener<FIELD extends AnyControl>(
  parent: SelectionGroup<FIELD>
): ChangeListener<BaseControl> {
  return [
    ControlChange.Value |
      ControlChange.Valid |
      ControlChange.Touched |
      ControlChange.Dirty,
    (child, change) => {
      let flags: ControlChange = change & ControlChange.Value;
      if (change & ControlChange.Valid) {
        const valid =
          child.valid && (parent.valid || parent.visitChildren((c) => c.valid));
        flags |= parent.updateValid(valid);
      }
      if (change & ControlChange.Dirty) {
        const { selected, value } = parent.fields;
        const dirty = selected.dirty || (selected.value && value.dirty);
        flags |= parent.updateDirty(dirty);
      }
      if (change & ControlChange.Touched) {
        flags |= parent.updateTouched(child.touched || parent.touched);
      }
      parent.runChange(flags);
    },
  ];
}
