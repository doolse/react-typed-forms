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

export type ChangeListener<V, S> = [
  ControlChange,
  (control: FormControl<V, S>, cb: ControlChange) => void
];

let controlCount = 0;

interface BaseControlMetadata {
  element?: HTMLElement | null;
}

type FormControlFields<V> = V extends object
  ? { [K in keyof V]-?: FormControl<V[K]> }
  : never;

type FormControlElems<V> = V extends Array<infer E> ? FormControl<E>[] : never;

interface FormControl<V, S = BaseControlMetadata> {
  uniqueId: number;
  stateVersion: number;
  setTouched(showValidation: boolean): void;
  markAsClean(): void;
  value: V;
  error?: string;
  valid: boolean;
  dirty: boolean;
  disabled: boolean;
  touched: boolean;
  groupedChanges(run: () => void): FormControl<V, S>;
  unfreeze(notify?: boolean): void;
  freeze(notify?: boolean): void;
  addChangeListener(
    listener: (control: FormControl<V, S>, change: ControlChange) => void,
    mask?: ControlChange
  ): void;
  removeChangeListener(
    listener: (control: FormControl<V, S>, change: ControlChange) => void
  ): void;
  setError(error?: string | null): FormControl<V, S>;
  validate(): FormControl<V, S>;
  fields: undefined extends V
    ? FormControlFields<V> | undefined
    : FormControlFields<V>;
  elems: undefined extends V
    ? FormControlElems<V> | undefined
    : FormControlElems<V>;
}

const la: FormControl<string[] | undefined> = {} as any;
interface ControlBuilder<V, S> {
  meta: S;
}

export class ControlImpl<V, S> implements FormControl<V, S> {
  flags: ControlFlags = ControlFlags.Valid;
  error?: string;
  uniqueId = ++controlCount;
  meta: S;
  valueSynced = true;

  constructor(private _value: V, builder: ControlBuilder<V, S>) {
    this.meta = builder.meta;
  }

  /**
   * @internal
   */
  listeners: ChangeListener<V, S>[] = [];
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
  runChange(changed: ControlChange): FormControl<V, S> {
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
        if ((m & ControlChange.Freeze) !== 0)
          cb(this as FormControl<V, S>, ControlChange.Freeze);
      });
    }
  }

  addChangeListener(
    listener: (control: FormControl<V, S>, change: ControlChange) => void,
    mask?: ControlChange
  ) {
    this.listeners = [
      ...this.listeners,
      [mask ? mask : ControlChange.All, listener],
    ];
  }

  removeChangeListener(
    listener: (control: FormControl<V, S>, change: ControlChange) => void
  ) {
    this.listeners = this.listeners.filter((cl) => cl[1] !== listener);
  }

  setError(error?: string | null): FormControl<V, S> {
    return this.runChange(this.updateError(error));
  }

  /**
   * Run validation listeners.
   */
  validate(): FormControl<V, S> {
    return this.runChange(ControlChange.Validate);
  }

  get fields(): V extends object
    ? { [K in keyof V]-?: FormControl<V[K]> }
    : never {
    return undefined as any;
  }
  get value(): V {
    return undefined as any;
  }

  markAsClean(): void {}

  setTouched(showValidation: boolean): void {}
}
