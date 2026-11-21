import * as popover from "@zag-js/popover";
import { normalizeProps, useMachine } from "@zag-js/react";
import { Portal } from "./Portal.tsx";
import { type ReactNode, useId } from "react";
import { css } from "styled-system/css";

const content = css({
  p: "14px",
  bg: "raised",
  border: "1px solid token(colors.rule)",
  borderRadius: "card",
  boxShadow: "0 8px 24px token(colors.shadow)",
  outline: "none",
  zIndex: 30,
});

/** A button that opens a small panel (Zag popover); `children` gets a `close` function. */
export function Popover({
  trigger,
  triggerClassName,
  label,
  children,
}: {
  trigger: ReactNode;
  triggerClassName: string;
  label: string;
  children: (close: () => void) => ReactNode;
}) {
  const service = useMachine(popover.machine, {
    id: useId(),
    positioning: { placement: "bottom-end" },
  });
  const api = popover.connect(service, normalizeProps);
  return (
    <>
      <button {...api.getTriggerProps()} className={triggerClassName}>
        {trigger}
      </button>
      <Portal>
        <div {...api.getPositionerProps()}>
          <div {...api.getContentProps()} aria-label={label} className={content}>
            {children(() => api.setOpen(false))}
          </div>
        </div>
      </Portal>
    </>
  );
}
