import * as menu from "@zag-js/menu";
import { normalizeProps, Portal, useMachine } from "@zag-js/react";
import { useId, type ReactNode } from "react";
import { css } from "styled-system/css";

export interface MenuItem {
  value: string;
  label: string;
  icon?: ReactNode;
  tone?: "danger";
}

const trigger = css({
  width: "28px",
  height: "28px",
  flexShrink: 0,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  border: 0,
  borderRadius: "14px",
  bg: "transparent",
  color: "muted",
  _hover: { bg: "chip", color: "ink" },
  "&[data-state=open]": { bg: "chip", color: "ink" },
  "&:focus-visible": { outline: "2px solid token(colors.violet)", outlineOffset: "1px" },
});
const content = css({
  minWidth: "220px",
  bg: "panel",
  borderRadius: "field",
  px: "14px",
  py: "6px",
  display: "flex",
  flexDirection: "column",
  fontSize: "13px",
  boxShadow: "0 6px 24px rgba(0,0,0,0.12)",
  outline: "none",
  zIndex: 20,
});
const item = css({
  display: "flex",
  alignItems: "center",
  gap: "10px",
  py: "9px",
  cursor: "pointer",
  color: "ink",
  "&:not(:last-child)": { borderBottom: "1px solid token(colors.rule)" },
  "&[data-highlighted]": { color: "violet" },
  "&[data-tone=danger][data-highlighted]": { color: "danger" },
});

/** The "⋯" actions menu of the design (grey panel, icon + label rows), driven by Zag's menu machine. */
export function ActionMenu({
  label,
  items,
  onSelect,
}: {
  label: string;
  items: MenuItem[];
  onSelect: (value: string) => void;
}) {
  const service = useMachine(menu.machine, {
    id: useId(),
    onSelect: (details) => onSelect(details.value),
    positioning: { placement: "bottom-end" },
  });
  const api = menu.connect(service, normalizeProps);
  return (
    <>
      <button {...api.getTriggerProps()} aria-label={label} className={trigger}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <circle cx="5" cy="12" r="1.6" />
          <circle cx="12" cy="12" r="1.6" />
          <circle cx="19" cy="12" r="1.6" />
        </svg>
      </button>
      <Portal>
        <div {...api.getPositionerProps()}>
          <div {...api.getContentProps()} className={content}>
            {items.map((i) => (
              <div
                key={i.value}
                {...api.getItemProps({ value: i.value })}
                data-tone={i.tone}
                className={item}
              >
                {i.icon}
                {i.label}
              </div>
            ))}
          </div>
        </div>
      </Portal>
    </>
  );
}
