import {
  ChangeListenerFunc,
  collectChange,
  Control,
  ControlChange,
} from "@astroapps/controls";

const restoreControlSymbol = Symbol("restoreControl");

export function trackedValue<A>(
  c: Control<A>,
  tracker?: ChangeListenerFunc<any>,
): A {
  const cc = c.current;
  const cv = cc.value;
  if (cv == null) {
    t(ControlChange.Structure);
    return cv;
  }
  if (typeof cv !== "object") {
    t(ControlChange.Value);
    return cv;
  }
  t(ControlChange.Structure);
  return new Proxy(cv, {
    get(target: object, p: string | symbol, receiver: any): any {
      if (p === restoreControlSymbol) return c;
      if (Array.isArray(cv)) {
        if (p === "length") return (cc.elements as any).length;
        if (typeof p === "symbol" || p[0] > "9" || p[0] < "0")
          return Reflect.get(cv, p);
        const nc = (cc.elements as any)[p];
        if (typeof nc === "function") return nc;
        if (nc == null) return null;
        return trackedValue(nc, tracker);
      }
      return trackedValue((cc.fields as any)[p], tracker);
    },
  }) as A;

  function t(cc: ControlChange) {
    return (tracker ?? collectChange)?.(c, cc);
  }
}

export function unsafeRestoreControl<A>(v: A): Control<A> | undefined {
  return (v as any)[restoreControlSymbol];
}
