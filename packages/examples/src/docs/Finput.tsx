import {
  ControlChange,
  FormControl,
  useControlChangeEffect,
  useControlStateVersion,
} from "@react-typed-forms/core";

// Only allow strings and numbers
export type FinputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  state: FormControl<string | number>;
};

export function Finput({ state, ...others }: FinputProps) {
  // Re-render on value or disabled state change
  useControlStateVersion(state, ControlChange.Value | ControlChange.Disabled);

  // Update the HTML5 custom validity whenever the error message is changed/cleared
  useControlChangeEffect(
    state,
    (s) =>
      (state.element as HTMLInputElement)?.setCustomValidity(state.error ?? ""),
    ControlChange.Error
  );
  return (
    <input
      ref={(r) => {
        state.element = r;
        if (r) r.setCustomValidity(state.error ?? "");
      }}
      value={state.value}
      disabled={state.disabled}
      onChange={(e) => state.setValue(e.currentTarget.value)}
      onBlur={() => state.setTouched(true)}
      {...others}
    />
  );
}
