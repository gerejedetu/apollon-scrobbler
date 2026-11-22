import * as zagSwitch from "@zag-js/switch";
import { normalizeProps, useMachine } from "@zag-js/react";
import { useId } from "react";
import { css } from "styled-system/css";

const control = css({
  position: "relative",
  flexShrink: 0,
  width: "44px",
  height: "26px",
  borderRadius: "pill",
  bg: "dashed",
  transition: "background 120ms",
  "&[data-state=checked]": { bg: "violet" },
});
const thumb = css({
  position: "absolute",
  top: "3px",
  left: "3px",
  width: "20px",
  height: "20px",
  borderRadius: "pill",
  bg: "knob",
  boxShadow: "0 1px 2px token(colors.shadow)",
  transition: "left 120ms",
  "&[data-state=checked]": { left: "21px" },
});

/** A switch and its label on one line (Zag machine), as in the settings board. */
export function Switch({
  label,
  checked,
  disabled,
  onCheckedChange,
}: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  const service = useMachine(zagSwitch.machine, {
    id: useId(),
    checked,
    disabled,
    label,
    onCheckedChange: (details) => onCheckedChange(details.checked),
  });
  const api = zagSwitch.connect(service, normalizeProps);
  return (
    <label
      {...api.getRootProps()}
      className={css({
        display: "flex",
        alignItems: "center",
        gap: "14px",
        cursor: "pointer",
        alignSelf: "flex-start",
      })}
    >
      <input {...api.getHiddenInputProps()} />
      <span {...api.getControlProps()} className={control}>
        <span {...api.getThumbProps()} className={thumb} />
      </span>
      <span {...api.getLabelProps()} className={css({ fontSize: "13px" })}>
        {label}
      </span>
    </label>
  );
}
