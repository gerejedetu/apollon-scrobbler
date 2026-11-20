import * as zagSwitch from "@zag-js/switch";
import { normalizeProps, useMachine } from "@zag-js/react";
import { useId, type ReactNode } from "react";
import { css } from "styled-system/css";

const root = css({
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: "24px",
  p: "18px",
  bg: "panel",
  borderRadius: "card",
  cursor: "pointer",
});
const control = css({
  position: "relative",
  flexShrink: 0,
  width: "44px",
  height: "26px",
  borderRadius: "13px",
  bg: "dashed",
  transition: "background 120ms",
  "&[data-state=checked]": { bg: "violet" },
  "&[data-focus-visible]": { outline: "2px solid token(colors.violet)", outlineOffset: "2px" },
});
const thumb = css({
  position: "absolute",
  top: "3px",
  left: "3px",
  width: "20px",
  height: "20px",
  borderRadius: "10px",
  bg: "page",
  boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
  transition: "left 120ms",
  "&[data-state=checked]": { left: "21px" },
});

interface SwitchProps {
  label: string;
  description?: ReactNode;
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (checked: boolean) => void;
}

/** The settings toggle: a grey card with a title, an explanation and a switch (Zag machine). */
export function SwitchCard({
  label,
  description,
  checked,
  disabled,
  onCheckedChange,
}: SwitchProps) {
  const service = useMachine(zagSwitch.machine, {
    id: useId(),
    checked,
    disabled,
    label,
    onCheckedChange: (details) => onCheckedChange(details.checked),
  });
  const api = zagSwitch.connect(service, normalizeProps);
  return (
    <label {...api.getRootProps()} className={root}>
      <span className={css({ display: "flex", flexDirection: "column", gap: "4px" })}>
        <span {...api.getLabelProps()} className={css({ fontSize: "14px", fontWeight: "500" })}>
          {label}
        </span>
        {description ? (
          <span className={css({ fontSize: "12px", lineHeight: "18px", color: "muted" })}>
            {description}
          </span>
        ) : null}
      </span>
      <input {...api.getHiddenInputProps()} />
      <span {...api.getControlProps()} className={control}>
        <span {...api.getThumbProps()} className={thumb} />
      </span>
    </label>
  );
}
