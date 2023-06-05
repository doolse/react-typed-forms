import React, {
  ChangeEvent,
  DependencyList,
  FC,
  MutableRefObject,
  ReactElement,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  addAfterChangesCallback,
  collectChanges,
  controlGroup,
  newControl,
  newElement,
  setFields,
  basicShallowEquals,
  trackControlChange,
  updateElements,
  ValueAndDeps,
} from "./controlImpl";
import {
  ChangeListenerFunc,
  Control,
  ControlChange,
  ControlSetup,
  ControlValue,
} from "./types";

interface ComputeState<V> {
  value?: ValueAndDeps<V>;
  listener?: ChangeListenerFunc<any>;
  compute?: () => V;
  effect?: () => void;
}
export function useControlEffect<V>(
  compute: () => V,
  onChange: (value: V) => void,
  initial?: ((value: V) => void) | boolean
) {
  const lastRef = useRef<ComputeState<V>>({ compute });
  lastRef.current.compute = compute;
  function checkEffect(dontRunEffect?: boolean) {
    const changes = collectChanges(lastRef.current.compute!);
    const changed = adjustListeners(lastRef, changes, checkEffect);
    const res = changes[0];
    const effectFunction =
      changed === undefined
        ? typeof initial === "function"
          ? initial
          : initial
          ? onChange
          : undefined
        : changed[0]
        ? onChange
        : undefined;
    if (effectFunction) {
      if (dontRunEffect) {
        lastRef.current.effect = () => effectFunction(res);
      } else {
        effectFunction(res);
      }
    }
  }

  checkEffect(true);
  useEffect(() => {
    const effect = lastRef.current.effect;
    if (effect) {
      lastRef.current.effect = undefined;
      effect();
    }
  });
  useClearListeners(lastRef);
}

function useClearListeners<V>(lastRef: MutableRefObject<ComputeState<V>>) {
  return useEffect(() => {
    return () => {
      const c = lastRef.current;
      if (c.value) {
        removeListeners(c.listener!, c.value[1]);
        c.value[1] = [];
      }
    };
  }, []);
}

function adjustListeners<V>(
  lastRef: MutableRefObject<ComputeState<V>>,
  computed: ValueAndDeps<V>,
  changeListener: () => void
) {
  const [res, deps] = computed;
  const c = lastRef.current;
  if (c.value) {
    const [oldRes, oldDeps] = c.value;
    const depsChanged =
      oldDeps.length !== deps.length || deps.some((x, i) => x !== oldDeps[i]);
    if (depsChanged) {
      removeListeners(c.listener!, oldDeps);
      c.listener = makeAfterChangeListener(changeListener);
      attachListeners(c.listener, deps);
    }
    c.value = computed;
    return [!basicShallowEquals(res, oldRes), depsChanged];
  } else {
    const listener = makeAfterChangeListener(changeListener);
    attachListeners(listener, deps);
    c.value = computed;
    c.listener = listener;
    return undefined;
  }
}

export function useValueChangeEffect<V>(
  control: Control<V>,
  changeEffect: (control: V) => void,
  debounce?: number,
  runInitial?: boolean
) {
  const effectRef = useRef<[(control: V) => void, any, number?]>([
    changeEffect,
    undefined,
    debounce,
  ]);
  effectRef.current[0] = changeEffect;
  effectRef.current[2] = debounce;
  useEffect(() => {
    const updater = (c: Control<V>) => {
      const r = effectRef.current;
      if (r[2]) {
        if (r[1]) clearTimeout(r[1]);
        r[1] = setTimeout(() => {
          effectRef.current[0](c.current.value);
        }, r[2]);
      } else {
        r[0](c.current.value);
      }
    };
    runInitial ? updater(control) : undefined;
    control.addChangeListener(updater, ControlChange.Value);
    return () => control.removeChangeListener(updater);
  }, [control]);
}

export interface FormArrayProps<V> {
  control: Control<V[] | undefined>;
  children: (elems: Control<V>[]) => ReactNode;
}

export function FormArray<V>({ control, children }: FormArrayProps<V>) {
  return (
    <>
      {useControlValue(() => {
        const v = control.optional?.elements;
        return v ? children(v) : null;
      })}
    </>
  );
}

export function renderAll<V>(
  render: (c: Control<V>, index: number) => ReactNode
): (elems: Control<V>[]) => ReactNode {
  return (e) => e.map(render);
}

export function useAsyncValidator<V>(
  control: Control<V>,
  validator: (
    control: Control<V>,
    abortSignal: AbortSignal
  ) => Promise<string | null | undefined>,
  delay: number,
  validCheckValue: (control: Control<V>) => any = (c) => c.value
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
            const [live] = collectChanges(() => validCheckValue(control));
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
    }
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

export function genericProps<V, E extends HTMLElement>(
  state: Control<V>
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

export function useControl<V, M = any>(
  initialState: V | (() => V),
  configure?: ControlSetup<V, M>,
  afterInit?: (c: Control<V>) => void
): Control<V>;

export function useControl<V = undefined>(): Control<V | undefined>;

export function useControl(
  v?: any,
  configure?: ControlSetup<any, any>,
  afterInit?: (c: Control<any>) => void
): Control<any> {
  return useState(() => {
    const rv = typeof v === "function" ? v() : v;
    const c = newControl(rv, configure);
    afterInit?.(c);
    return c;
  })[0];
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
    value: Control<V>
  ) => Control<SelectionGroup<V>>;
}

type SelectionGroupSync<V> = (
  original: Control<V[]>
) => [boolean, Control<V>, boolean?][];

const defaultSelectionCreator: SelectionGroupSync<any> = (original) => {
  return original.elements.map((x) => [true, x]);
};

export function ensureSelectableValues<V>(
  values: V[],
  key: (v: V) => any
): SelectionGroupSync<V> {
  return (original) => {
    const otherSelected = [...original.elements];
    const fromValues: [boolean, Control<V>][] = values.map((x) => {
      const origIndex = otherSelected.findIndex(
        (e) => key(e.current.value) === key(x)
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
  groupSyncer: SelectionGroupSync<V> = defaultSelectionCreator,
  setup?: ControlSetup<SelectionGroup<V>[]>,
  reset?: any
): Control<SelectionGroup<V>[]> {
  const selectable = useMemo(() => {
    const selectable = newControl<SelectionGroup<V>[]>([], setup);
    const selectionChangeListener = () => {
      updateElements(control, () =>
        selectable.elements
          .filter((x) => x.fields.selected.current.value)
          .map((x) => x.fields.value)
      );
    };

    const selectableElems = groupSyncer(control).map(([s, value, is]) => {
      const selected = newControl(s, undefined, is === undefined ? s : is);
      selected.addChangeListener(selectionChangeListener, ControlChange.Value);
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
      selectable.elements
        .filter((x) => x.fields.selected.current.value)
        .map((x) => x.fields.value)
    );
  }, [selectable, control]);
  return selectable;
}

function removeListeners(
  listener: ChangeListenerFunc<any>,
  deps: (Control<any> | ControlChange)[]
) {
  for (let i = 0; i < deps.length; i++) {
    const depC = deps[i++] as Control<any>;
    depC.removeChangeListener(listener);
  }
}

function attachListeners(
  listener: ChangeListenerFunc<any>,
  deps: (Control<any> | ControlChange)[]
) {
  for (let i = 0; i < deps.length; i++) {
    const depC = deps[i++] as Control<any>;
    const depChange = deps[i] as ControlChange;
    depC.addChangeListener(listener, depChange);
  }
}

function makeAfterChangeListener(effect: () => void): ChangeListenerFunc<any> {
  let afterCbAdded = false;
  return () => {
    if (!afterCbAdded) {
      afterCbAdded = true;
      addAfterChangesCallback(() => {
        effect();
        afterCbAdded = false;
      });
    }
  };
}

/**
 * Get value of a control and re-render current component whenever the value is changed.
 * This is equivalent to `useControlValue(() => control.value);`
 * @param control The control to retrieve the value from
 */
export function useControlValue<V>(control: Control<V>): V;

/**
 * Calculate a value from control properties and re-render the current component whenever
 * any of those properties changes.
 * @param stateValue The function which calculates the value.
 */
export function useControlValue<V>(stateValue: (previous?: V) => V): V;

export function useControlValue<V>(
  controlOrValue: Control<V> | ((previous?: V) => V)
) {
  const compute =
    typeof controlOrValue === "function"
      ? controlOrValue
      : () => controlOrValue.value;
  const lastRef = useRef<ComputeState<V>>({});

  const [_, rerender] = useState(0);
  const computed = collectChanges(compute);

  useEffect(() => {
    adjustListeners(lastRef, computed, () => rerender((x) => x + 1));
  });

  useClearListeners(lastRef);
  return computed[0];
}

export function useComputed<V>(compute: () => V): Control<V> {
  const c = useControl(() => collectChanges(compute)[0]);
  useControlEffect(compute, (v) => (c.value = v), true);
  return c;
}

export function useControlGroup<C extends { [k: string]: any }>(
  fields: C,
  deps?: DependencyList
): Control<{ [K in keyof C]: ControlValue<C[K]> }> {
  const newControl = useState(() => controlGroup(fields))[0];
  useEffect(() => {
    setFields(newControl, fields);
  }, deps ?? Object.values(fields));
  return newControl;
}

export function usePreviousValue<V>(
  control: Control<V>
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
      }))
  );
  return withPrev;
}

export function RenderControl({ children }: { children: () => ReactNode }) {
  return <>{useControlValue(children)}</>;
}

export function RenderValue<V>({
  toValue,
  children,
}: {
  toValue: (previous?: V) => V;
  children: (v: V) => ReactNode;
}) {
  const v = useControlValue(toValue);
  return <>{children(v)}</>;
}

export function RenderForm<V, E extends HTMLElement = HTMLElement>({
  control,
  children,
}: {
  control: Control<V>;
  children: (fcp: FormControlProps<V, E>) => ReactNode;
}) {
  return <>{useControlValue(() => children(genericProps<V, E>(control)))}</>;
}

/**
 * Optionally render based on whether the control contains a null or undefined.
 * Useful for rendering loading spinners.
 * @param control The control
 * @param render Callback to render if the value is not null
 * @param elseRender Content to render if the value is null
 */
export function renderOptional<V>(
  control: Control<V | undefined | null>,
  render: (c: Control<V>) => ReactNode,
  elseRender?: ReactNode
): () => ReactNode {
  return () => {
    const o = control.optional;
    return o ? render(o) : elseRender ?? <></>;
  };
}

type ValuesOfControls<A> = { [K in keyof A]: NonNullable<ControlValue<A[K]>> };

/**
 * Given an object containing nullable value controls, optionally render if all controls are not null.
 * Useful for rendering loading spinners.
 * @param controls The object containing nullable controls.
 * @param render Callback which takes the non-null values of all the controls passed in.
 * @param elseRender Content to render if any value is null
 */
export function renderOptionally<A extends Record<string, Control<any>>>(
  controls: A,
  render: (v: ValuesOfControls<A>) => ReactNode,
  elseRender?: ReactNode
): () => ReactNode {
  return () => {
    const out: Record<string, any> = {};
    let ready = true;
    Object.entries(controls).forEach((x) => {
      const v = x[1].value;
      if (v != null) {
        out[x[0]] = v;
      } else ready = false;
    });
    return ready ? render(out as ValuesOfControls<A>) : elseRender ?? <></>;
  };
}
