import {
  ChangeEvent,
  DependencyList,
  FC,
  MutableRefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useDebounced } from "./util";
import {
  ChangeListenerFunc,
  setChangeCollector,
  SubscriptionTracker,
} from "@astroapps/controls";
import {
  collectChanges,
  Control,
  ControlChange,
  controlGroup,
  ControlSetup,
  ControlValue,
  createEffect,
  deepEquals,
  newControl,
  newElement,
  runPendingChanges,
  setFields,
  trackControlChange,
  unsafeFreezeCountEdit,
  updateElements,
} from "@astroapps/controls";

export function useRefState<A>(init: () => A): [MutableRefObject<A>, boolean] {
  const ref = useRef<A | null>(null);
  const isInitial = !ref.current;
  if (isInitial) {
    ref.current = init();
  }
  return [ref as MutableRefObject<A>, isInitial];
}

/**
 * Run effects based when a computed value changes.
 *
 * @param compute A function which calculates a value, if the value ever changes (equality is a shallow equals), the `onChange` effect is called.
 * @param onChange The effect to run when the calculated value changes
 * @param initial This will be called first time if a function is passed in, or if `true` the `onChange` handler will run first time
 */
export function useControlEffect<V>(
  compute: () => V,
  onChange: (value: V) => void,
  initial?: ((value: V) => void) | boolean,
) {
  const [effectRef, isInitial] = useRefState(() =>
    createEffect(
      compute,
      typeof initial === "function" ? initial : initial ? onChange : () => {},
    ),
  );
  let effect = effectRef.current;
  effect.run = (cur, prev) => {
    if (!deepEquals(cur, prev)) onChange(cur);
  };
  if (!isInitial) {
    effect.calculate = compute;
    effect.runEffect();
  }

  useEffect(() => () => effectRef.current.cleanup(), [effectRef]);
}

export function useValueChangeEffect<V>(
  control: Control<V>,
  changeEffect: (control: V) => void,
  debounce: number,
  runInitial?: boolean,
): void;

export function useValueChangeEffect<V>(
  control: Control<V>,
  changeEffect: (control: V) => void,
): void;

export function useValueChangeEffect<V>(
  control: Control<V>,
  changeEffect: (control: V) => void,
  debounce: undefined,
  runInitial?: boolean,
): void;

export function useValueChangeEffect<V>(
  control: Control<V>,
  changeEffect: (control: V) => void,
  debounce?: number,
  runInitial?: boolean,
) {
  const realFunc =
    typeof debounce === "number"
      ? useDebounced(changeEffect, debounce)
      : changeEffect;
  useControlEffect(() => control.value, realFunc, runInitial);
}

export function useValidator<V>(
  control: Control<V>,
  validator: (value: V) => string | null | undefined,
  key: string = "default",
) {
  const calculate = () => {
    trackControlChange(control, ControlChange.Validate);
    return validator(control.value);
  };
  const setError = (msg: string | null | undefined) => {
    control.setError(key, msg);
  };
  const [effectRef] = useRefState(() => createEffect(calculate, setError));
  const effect = effectRef.current;
  effect.run = setError;
  effect.calculate = calculate;
  useEffect(() => {
    return () => effect.cleanup();
  }, [effect]);
  useEffect(() => () => control.setError(key, null), [control, key]);
}

export function useAsyncValidator<V>(
  control: Control<V>,
  validator: (
    control: Control<V>,
    abortSignal: AbortSignal,
  ) => Promise<string | null | undefined>,
  delay: number,
  validCheckValue: (control: Control<V>) => any = (c) => c.value,
) {
  const handler = useRef<number>();
  const abortController = useRef<AbortController>();
  useControlEffect(
    () => {
      trackControlChange(control, ControlChange.Validate);
      return validCheckValue(control);
    },
    (currentVersion) => {
      if (handler.current) {
        window.clearTimeout(handler.current);
      }
      if (abortController.current) {
        abortController.current.abort();
      }
      handler.current = window.setTimeout(() => {
        const aborter = new AbortController();
        abortController.current = aborter;
        validator(control, aborter.signal)
          .then((error) => {
            const live = validCheckValue(control);
            if (live === currentVersion) {
              control.touched = true;
              control.error = error;
            }
          })
          .catch((e) => {
            if (
              !(e instanceof DOMException && e.code == DOMException.ABORT_ERR)
            ) {
              throw e;
            }
          });
      }, delay);
    },
  );
}

export interface FormControlProps<V, E extends HTMLElement> {
  value: V;
  onChange: (e: ChangeEvent<E & { value: any }>) => void;
  onBlur: () => void;
  disabled: boolean;
  errorText?: string | null;
  ref: (elem: HTMLElement | null) => void;
}

export function formControlProps<V, E extends HTMLElement>(
  state: Control<V>,
): FormControlProps<V, E> {
  const error = state.error;
  const valid = state.valid;
  return {
    ref: (elem) => {
      state.element = elem;
    },
    value: state.value,
    disabled: state.disabled,
    errorText: state.touched && !valid ? error : undefined,
    onBlur: () => (state.touched = true),
    onChange: (e) => (state.value = e.target.value),
  };
}

/**
 * Initialise a control given an initial value. The api purposefully mirrors the common cases of the useState() hook.
 * @param initialState The initial state to use or a callback to create it if the computation isn't trivial.
 * @param configure Configuration for the control, in particular synchronous validators.
 * @param afterInit A callback called directly after Control instantiation.
 */
export function useControl<V, M = any>(
  initialState: V | (() => V),
  configure?: ControlSetup<V, M> & { use?: Control<V> },
  afterInit?: (c: Control<V>) => void,
): Control<V>;

/**
 * Initialise a control for the given type, but set it's initial value to undefined. The api purposefully mirrors the common cases of the useState() hook.
 */
export function useControl<V = undefined>(): Control<V | undefined>;

export function useControl(
  v?: any,
  configure?: ControlSetup<any, any> & { use?: Control<any> },
  afterInit?: (c: Control<any>) => void,
): Control<any> {
  const controlRef = useRefState(() => {
    const rv = typeof v === "function" ? v() : v;
    const c = newControl(rv, configure);
    afterInit?.(c);
    return c;
  })[0];
  if (configure?.use) {
    controlRef.current = configure.use;
  }
  return controlRef.current;
}

export interface SelectionGroup<V> {
  selected: boolean;
  value: V;
}

interface SelectionGroupCreator<V> {
  makeElem: (v: V, iv: V) => Control<V>;
  makeGroup: (
    selected: boolean,
    wasSelected: boolean,
    value: Control<V>,
  ) => Control<SelectionGroup<V>>;
}

type SelectionGroupSync<V> = (
  original: Control<V[]>,
) => [boolean, Control<V>, boolean?][];

const defaultSelectionCreator: SelectionGroupSync<any> = (original) => {
  return original.current.elements.map((x) => [true, x]);
};

export function ensureSelectableValues<V>(
  values: V[],
  key: (v: V) => any,
): SelectionGroupSync<V> {
  return (original) => {
    const otherSelected = [...original.elements];
    const fromValues: [boolean, Control<V>][] = values.map((x) => {
      const origIndex = otherSelected.findIndex(
        (e) => key(e.current.value) === key(x),
      );
      const origElem = origIndex >= 0 ? otherSelected[origIndex] : undefined;
      if (origIndex >= 0) {
        otherSelected.splice(origIndex, 1);
      }
      return [Boolean(origElem), origElem ?? newElement(original, x)];
    });
    return fromValues.concat(otherSelected.map((x) => [true, x]));
  };
}

export function useSelectableArray<V>(
  control: Control<V[]>,
  groupSyncer: SelectionGroupSync<V> = defaultSelectionCreator as unknown as SelectionGroupSync<V>,
  setup?: ControlSetup<SelectionGroup<V>[]>,
  reset?: any,
): Control<SelectionGroup<V>[]> {
  const selectable = useMemo(() => {
    const selectable = newControl<SelectionGroup<V>[]>([], setup);
    const selectionChangeListener = () => {
      updateElements(control, () =>
        selectable.current.elements
          .filter((x) => x.fields.selected.current.value)
          .map((x) => x.fields.value),
      );
    };

    const selectableElems = groupSyncer(control).map(([s, value, is]) => {
      const selected = newControl(s, undefined, is === undefined ? s : is);
      selected.subscribe(selectionChangeListener, ControlChange.Value);
      return controlGroup({
        selected,
        value,
      });
    });
    updateElements(selectable, () => selectableElems);

    return selectable;
  }, [control, reset]);

  useEffect(() => {
    updateElements(control, () =>
      selectable.current.elements
        .filter((x) => x.fields.selected.current.value)
        .map((x) => x.fields.value),
    );
  }, [selectable, control]);
  return selectable;
}

/**
 * @deprecated Exactly the same as useComputed
 */
export function useCalculatedControl<V>(calculate: () => V): Control<V> {
  return useComputed(calculate);
}

/**
 * Computer a `Control` value based on other values and controls and recompute the value
 * when called or when dependant controls change.
 *
 * @param compute The function to compute the value based on other vales and `Control`s
 */
export function useComputed<V>(compute: () => V): Control<V> {
  const controlRef = useRef<Control<V>>();
  const [effectRef, isInitial] = useRefState(() =>
    createEffect(compute, (v) => {
      controlRef.current = newControl(v);
    }),
  );
  const control = controlRef.current!;
  let effect = effectRef.current;
  effect.run = (cur) => {
    control.value = cur;
  };
  if (!isInitial) {
    effect.calculate = compute;
    effect.runEffect();
  }

  useEffect(() => () => effectRef.current.cleanup(), [effectRef]);
  return control;
}

export function useControlGroup<C extends { [k: string]: Control<any> }>(
  fields: C,
  deps?: DependencyList,
): Control<{ [K in keyof C]: ControlValue<C[K]> }> {
  const newControl = useState(() => controlGroup(fields))[0];
  useEffect(
    () => {
      setFields(newControl, fields);
    },
    deps ?? Object.values(fields),
  );
  return newControl;
}

export function usePreviousValue<V>(
  control: Control<V>,
): Control<{ previous?: V; current: V }> {
  const withPrev = useControl<{ previous?: V; current: V }>(() => ({
    current: control.current.value,
  }));
  useControlEffect(
    () => control.value,
    (nextValue) =>
      withPrev.setValue(({ current }) => ({
        previous: current,
        current: nextValue,
      })),
  );
  return withPrev;
}

export function controlValues<A, B>(a: Control<A>, b: Control<B>): () => [A, B];
export function controlValues<A, B, C>(
  a: Control<A>,
  b: Control<B>,
  c: Control<C>,
): () => [A, B, C];
export function controlValues<A, B, C, D>(
  a: Control<A>,
  b: Control<B>,
  c: Control<C>,
  d: Control<D>,
): () => [A, B, C, D];
export function controlValues<A, B, C, D, E>(
  a: Control<A>,
  b: Control<B>,
  c: Control<C>,
  d: Control<D>,
  e: Control<E>,
): () => [A, B, C, D, E];
export function controlValues<A extends Record<string, Control<any>>>(
  controls: A,
): () => { [K in keyof A]: ControlValue<A[K]> };
export function controlValues(
  ...args: (Control<any> | Record<string, Control<any>>)[]
): () => any {
  return () => {
    if (args.length === 1) {
      return Object.fromEntries(
        Object.entries(args[0]).map((x) => [x[0], x[1].value]),
      );
    }
    return args.map((x) => x.value);
  };
}

export function useComponentTracking(): () => void {
  const [trackerRef] = useRefState(() => new ComponentTracker());
  const tracker = trackerRef.current;
  tracker.start();
  useSyncExternalStore(
    tracker.subscribe,
    tracker.getSnapshot,
    tracker.getServerSnapshot,
  );
  useEffect(() => {
    runPendingChanges();
  });
  return () => {
    tracker.stop();
  };
}

export function useTrackedComponent<A>(f: FC<A>, deps: any[]): FC<A> {
  return useCallback((a) => {
    const stop = useComponentTracking();
    try {
      return f(a);
    } finally {
      stop();
    }
  }, deps);
}

class ComponentTracker<V> extends SubscriptionTracker {
  changeCount = 0;
  listener?: ChangeListenerFunc<any>;

  constructor() {
    super((control, change) => {
      if (this.listener) this.listener(control, change);
    });
    this.listener = (c, change) => {
      this.changeCount++;
    };
  }

  start() {
    unsafeFreezeCountEdit(1);
    setChangeCollector(this.collectUsage);
  }

  stop() {
    setChangeCollector(undefined);
    this.update();
    unsafeFreezeCountEdit(-1);
  }

  getSnapshot: () => number = () => {
    return this.changeCount;
  };

  getServerSnapshot = this.getSnapshot;

  subscribe: (onChange: () => void) => () => void = (onChange) => {
    this.listener = (c, change) => {
      this.changeCount++;
      onChange();
    };
    return () => {
      this.listener = undefined;
      this.changeCount++;
      this.cleanup();
    };
  };
}
