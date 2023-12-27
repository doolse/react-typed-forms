export enum ControlFlags {
  None = 0,
  Valid = 1,
  Touched = 2,
  Dirty = 4,
  Disabled = 8,
}

export enum ControlChange {
  None = 0,
  Valid = 1,
  Touched = 2,
  Dirty = 4,
  Disabled = 8,
  Value = 16,
  InitialValue = 32,
  Error = 64,
  All = Value | Valid | Touched | Disabled | Error | Dirty | InitialValue,
  Structure = 128,
  Validate = 256,
}

export type ControlValidator<V> = ((v: V) => string | undefined | null) | null;
export type ControlValue<C> = C extends Control<infer V> ? V : never;
export type ElemType<V> = NonNullable<V> extends (infer E)[] ? E : never;

export interface ControlProperties<V> {
  value: V;
  initialValue: V;
  error: string | null | undefined;
  readonly errors: { [k: string]: string };
  readonly valid: boolean;
  readonly dirty: boolean;
  disabled: boolean;
  touched: boolean;
  readonly fields: V extends string | number | Array<any> | undefined | null
    ? undefined
    : V extends { [a: string]: any }
    ? { [K in keyof V]-?: Control<V[K]> }
    : V;
  readonly elements: V extends (infer A)[]
    ? Control<A>[]
    : V extends string | number | { [k: string]: any }
    ? never[]
    : V;
  readonly isNull: boolean;
}

type Readonly<V> = {
  readonly [P in keyof V]: V[P];
};

export interface Control<V> extends ControlProperties<V> {
  readonly uniqueId: number;
  current: Readonly<ControlProperties<V>>;
  meta: { [key: string]: any };

  subscribe(
    listener: ChangeListenerFunc<V>,
    mask?: ControlChange,
  ): Subscription;

  unsubscribe(listener: ChangeListenerFunc<V> | Subscription): void;

  setValue(v: (current: V) => V): Control<V>;

  setValueAndInitial(v: V, iv: V): Control<V>;

  setInitialValue(v: V): Control<V>;

  groupedChanges(run: () => void): Control<V>;

  isValueEqual(v: V): boolean;

  validate(): boolean;

  markAsClean(): void;

  setError(key: string, error: string | null | undefined): void;

  clearErrors(): void;

  lookupControl(path: (string | number)[]): Control<any> | undefined;

  element: HTMLElement | null;

  as<NV extends V>(): Control<NV>;
}

export interface ControlSetup<V, M = object> {
  meta?: M;
  validator?: ControlValidator<V>;
  equals?: (a: V, b: V) => boolean;
  elems?: ControlSetup<ElemType<V>, M> | (() => ControlSetup<ElemType<V>, M>);
  fields?: {
    [K in keyof V]?: ControlSetup<V[K], M> | (() => ControlSetup<V[K], M>);
  };
  create?: (value: V, initial: V, setup: ControlSetup<V, M>) => Control<V>;
  use?: Control<V>;
  afterCreate?: (control: Control<V>) => void;
}

export type ChangeListenerFunc<V> = (
  control: Control<V>,
  cb: ControlChange,
) => void;

export type Subscription = [ControlChange, ChangeListenerFunc<any>];
