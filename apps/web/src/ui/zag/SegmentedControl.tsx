import * as radio from "@zag-js/radio-group";
import { normalizeProps, useMachine } from "@zag-js/react";
import { useId } from "react";
import { css } from "styled-system/css";

const root = css({ display: "flex", gap: "2px", p: "2px", borderRadius: "button", bg: "chip" });
const item = css({
  flex: 1,
  height: "28px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "field",
  fontSize: "12px",
  color: "ink",
  cursor: "pointer",
  "&[data-state=checked]": {
    bg: "raised",
    boxShadow: "0 1px 2px token(colors.shadow)",
    fontWeight: "500",
  },
});

/** "Clair · Sombre · Auto": a radio group drawn as a segmented control (Zag radio-group machine). */
export function SegmentedControl<V extends string>({
  label,
  value,
  options,
  onValueChange,
}: {
  label: string;
  value: V;
  options: { value: V; label: string }[];
  onValueChange: (value: V) => void;
}) {
  const service = useMachine(radio.machine, {
    id: useId(),
    value,
    orientation: "horizontal",
    onValueChange: (d) => d.value && onValueChange(d.value as V),
  });
  const api = radio.connect(service, normalizeProps);
  return (
    <div {...api.getRootProps()} aria-label={label} className={root}>
      {options.map((o) => (
        <label key={o.value} {...api.getItemProps({ value: o.value })} className={item}>
          <span {...api.getItemTextProps({ value: o.value })}>{o.label}</span>
          <input {...api.getItemHiddenInputProps({ value: o.value })} />
        </label>
      ))}
    </div>
  );
}
