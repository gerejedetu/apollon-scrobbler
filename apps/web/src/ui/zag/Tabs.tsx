import * as tabs from "@zag-js/tabs";
import { normalizeProps, useMachine } from "@zag-js/react";
import { useId, type ReactNode } from "react";
import { css } from "styled-system/css";

const trigger = css({
  border: 0,
  bg: "transparent",
  p: 0,
  fontSize: "12px",
  color: "muted",
  "&[data-selected]": { color: "ink", fontWeight: "500" },
});

export interface TextTab<V extends string> {
  value: V;
  label: string;
  content: ReactNode;
}

/**
 * The small text switch in section headings ("Artistes · Albums · Titres", "Par mois · Par semaine").
 * The list sits in the heading (`renderHeading`), the panel below it.
 */
export function TextTabs<V extends string>({
  label,
  items,
  value,
  onValueChange,
  renderHeading,
}: {
  label: string;
  items: TextTab<V>[];
  value: V;
  onValueChange: (value: V) => void;
  renderHeading: (list: ReactNode) => ReactNode;
}) {
  const service = useMachine(tabs.machine, {
    id: useId(),
    value,
    onValueChange: (d) => onValueChange(d.value as V),
  });
  const api = tabs.connect(service, normalizeProps);
  const list = (
    <div
      {...api.getListProps()}
      aria-label={label}
      className={css({ display: "flex", gap: "14px" })}
    >
      {items.map((item) => (
        <button
          key={item.value}
          {...api.getTriggerProps({ value: item.value })}
          className={trigger}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
  return (
    <div {...api.getRootProps()} className={css({ display: "contents" })}>
      {renderHeading(list)}
      {items.map((item) => (
        <div key={item.value} {...api.getContentProps({ value: item.value })}>
          {item.content}
        </div>
      ))}
    </div>
  );
}
