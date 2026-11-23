import * as popover from "@zag-js/popover";
import { normalizeProps, useMachine } from "@zag-js/react";
import { useId } from "react";
import { icons, Menu } from "../../ui/apollon/index.ts";
import { Portal } from "../../ui/zag/index.ts";

export type MenuItem =
  | { label: string; icon?: string; danger?: boolean; onClick: () => void }
  | "-";

/** The ⋮ of a row or a hero (design system: IconButton + Menu), opened in a popover. */
export function MenuButton({
  label,
  items,
  size = "sm",
}: {
  label: string;
  items: MenuItem[];
  size?: "sm" | "md";
}) {
  const service = useMachine(popover.machine, {
    id: useId(),
    positioning: { placement: "bottom-end", gutter: 4 },
  });
  const api = popover.connect(service, normalizeProps);
  return (
    <>
      <button
        {...api.getTriggerProps()}
        aria-label={label}
        className={size === "sm" ? "ap-iconbtn ap-iconbtn--sm" : "ap-iconbtn"}
      >
        {icons.dots()}
      </button>
      <Portal>
        {/* Keep Zag's positioning styles: only add the stacking order. */}
        <div
          {...api.getPositionerProps()}
          className="ap-root"
          style={{ ...api.getPositionerProps().style, zIndex: 40 }}
        >
          <div {...api.getContentProps()} style={{ outline: "none" }}>
            <Menu
              items={items.map((i) =>
                i === "-"
                  ? i
                  : {
                      ...i,
                      onClick: () => {
                        api.setOpen(false);
                        i.onClick();
                      },
                    },
              )}
            />
          </div>
        </div>
      </Portal>
    </>
  );
}
