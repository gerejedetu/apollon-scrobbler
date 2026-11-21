import * as clipboard from "@zag-js/clipboard";
import { normalizeProps, useMachine } from "@zag-js/react";
import { useId } from "react";
import { css } from "styled-system/css";
import { CheckIcon, CopyIcon } from "../icons.tsx";
import { button } from "../primitives/Button.tsx";
import { m } from "../../paraglide/messages.js";

const field = css({
  flex: 1,
  minWidth: 0,
  height: "40px",
  px: "12px",
  border: 0,
  borderRadius: "field",
  bg: "raised",
  boxShadow: "inset 0 0 0 1px token(colors.violetLine)",
  font: "inherit",
  fontSize: "13px",
  color: "ink",
});

/** A read-only value with a Copy button (Zag clipboard machine); the button says "Copié" for a moment. */
export function CopyField({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: string;
  /** The secret itself: bolder, letter-spaced, violet button. */
  emphasis?: boolean;
}) {
  const service = useMachine(clipboard.machine, { id: useId(), value, timeout: 2000 });
  const api = clipboard.connect(service, normalizeProps);
  return (
    <div
      {...api.getRootProps()}
      className={css({ display: "flex", flexDirection: "column", gap: "8px" })}
    >
      <span {...api.getLabelProps()} className={css({ fontSize: "13px", fontWeight: "500" })}>
        {label}
      </span>
      <div {...api.getControlProps()} className={css({ display: "flex", gap: "8px" })}>
        <input
          {...api.getInputProps()}
          className={field}
          style={emphasis ? { fontWeight: 500, letterSpacing: "0.02em" } : undefined}
        />
        <button
          {...api.getTriggerProps()}
          className={button({ tone: emphasis ? "accent" : "soft", size: "md" })}
        >
          {api.copied ? <CheckIcon /> : <CopyIcon />}
          {api.copied ? m.copied() : m.copy()}
        </button>
      </div>
    </div>
  );
}
