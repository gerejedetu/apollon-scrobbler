import * as menu from "@zag-js/menu";
import { normalizeProps, Portal, useMachine } from "@zag-js/react";
import { Fragment, useId, type ReactNode } from "react";
import { css } from "styled-system/css";

export interface MenuItem {
  value: string;
  label: string;
  icon?: ReactNode;
  tone?: "danger";
  /** Draws a line above the item (the design separates the destructive action). */
  separated?: boolean;
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
  color: "ink",
  _hover: { bg: "chip" },
  "&[data-state=open]": { bg: "chip" },
  "&:focus-visible": { outline: "2px solid token(colors.violet)", outlineOffset: "1px" },
});
const content = css({
  width: "248px",
  p: "6px",
  boxSizing: "border-box",
  bg: "page",
  border: "1px solid token(colors.rule)",
  borderRadius: "card",
  boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
  display: "flex",
  flexDirection: "column",
  outline: "none",
  zIndex: 20,
});
const item = css({
  display: "flex",
  alignItems: "center",
  gap: "10px",
  height: "36px",
  px: "10px",
  borderRadius: "field",
  fontSize: "13px",
  color: "ink",
  cursor: "pointer",
  "&[data-highlighted]": { bg: "field" },
  "&[data-tone=danger]": { color: "danger" },
});
const separator = css({ height: "1px", mx: "4px", my: "6px", bg: "rule" });

/** The "⋯" dropdown of a listen (white panel, icon + label rows), driven by Zag's menu machine. */
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
          <circle cx="5" cy="12" r="1.8" />
          <circle cx="12" cy="12" r="1.8" />
          <circle cx="19" cy="12" r="1.8" />
        </svg>
      </button>
      <Portal>
        <div {...api.getPositionerProps()}>
          <div {...api.getContentProps()} className={content}>
            {items.map((i) => (
              <Fragment key={i.value}>
                {i.separated ? <div {...api.getSeparatorProps()} className={separator} /> : null}
                <div {...api.getItemProps({ value: i.value })} data-tone={i.tone} className={item}>
                  {i.icon}
                  {i.label}
                </div>
              </Fragment>
            ))}
          </div>
        </div>
      </Portal>
    </>
  );
}
