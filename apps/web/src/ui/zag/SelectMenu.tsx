import * as menu from "@zag-js/menu";
import { normalizeProps, Portal, useMachine } from "@zag-js/react";
import { Fragment, useId } from "react";
import { css } from "styled-system/css";
import { CalendarIcon, CheckIcon, ChevronDown } from "../icons.tsx";

export interface SelectOption<V extends string> {
  value: V;
  label: string;
  /** Draws a separator above (groups of the design: current periods, last periods, all time). */
  separated?: boolean;
}

const trigger = css({
  height: "32px",
  pl: "12px",
  pr: "10px",
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  flexShrink: 0,
  border: "1px solid token(colors.dashed)",
  borderRadius: "button",
  bg: "page",
  color: "ink",
  fontSize: "13px",
  fontWeight: "500",
  cursor: "pointer",
  "& > svg:first-child": { color: "muted" },
  _hover: { borderColor: "ink" },
  "&[data-state=open]": { borderColor: "ink" },
  "&:focus-visible": { outline: "2px solid token(colors.violet)", outlineOffset: "1px" },
});
const content = css({
  width: "232px",
  p: "6px",
  boxSizing: "border-box",
  bg: "raised",
  border: "1px solid token(colors.rule)",
  borderRadius: "card",
  boxShadow: "0 8px 24px token(colors.shadow)",
  display: "flex",
  flexDirection: "column",
  outline: "none",
  zIndex: 30,
});
const item = css({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "10px",
  height: "34px",
  px: "10px",
  borderRadius: "field",
  fontSize: "13px",
  color: "ink",
  cursor: "pointer",
  "&[data-highlighted]": { bg: "field" },
  "&[data-state=checked]": { bg: "field", fontWeight: "500" },
  "& svg": { color: "violet" },
});
const separator = css({ height: "1px", mx: "4px", my: "6px", bg: "rule" });

/** The "📅 Ce mois-ci ⌄" button and its menu of choices (period, year), on Zag's menu machine. */
export function SelectMenu<V extends string>({
  label,
  value,
  options,
  onValueChange,
}: {
  label: string;
  value: V;
  options: SelectOption<V>[];
  onValueChange: (value: V) => void;
}) {
  const service = useMachine(menu.machine, {
    id: useId(),
    positioning: { placement: "bottom-start" },
  });
  const api = menu.connect(service, normalizeProps);
  const current = options.find((o) => o.value === value)?.label ?? value;
  return (
    <>
      <button {...api.getTriggerProps()} aria-label={`${label} : ${current}`} className={trigger}>
        <CalendarIcon />
        {current}
        <ChevronDown size={14} />
      </button>
      <Portal>
        <div {...api.getPositionerProps()}>
          <div {...api.getContentProps()} aria-label={label} className={content}>
            {options.map((o) => (
              <Fragment key={o.value}>
                {o.separated ? <div {...api.getSeparatorProps()} className={separator} /> : null}
                <div
                  {...api.getOptionItemProps({
                    type: "radio",
                    value: o.value,
                    checked: o.value === value,
                    onCheckedChange: () => onValueChange(o.value),
                  })}
                  className={item}
                >
                  {o.label}
                  {o.value === value ? <CheckIcon size={14} /> : null}
                </div>
              </Fragment>
            ))}
          </div>
        </div>
      </Portal>
    </>
  );
}
