import { useRef } from "react";

export function useDebounced<T extends Function>(func: T, delay: number) {
  const ref = useRef<[T, number | undefined, AbortController | undefined]>([
    func,
    undefined,
    undefined,
  ]);
  return (...args: any[]) => {
    const c = ref.current;
    if (c[1]) clearTimeout(c[1]);
    if (c[2] instanceof AbortController) {
      c[2]!.abort();
      c[2] = undefined;
    }
    c[1] = setTimeout(
      () => (ref.current[2] = ref.current[0].apply(null, args)),
      delay,
      [],
    );
  };
}
