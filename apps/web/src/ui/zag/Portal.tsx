import { Portal as ZagPortal } from "@zag-js/react";
import { type ReactNode, useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * Zag's Portal renders its children inline on the server and into document.body in the browser,
 * so the two trees differ and every useId below it mismatches on hydration. Menus and popovers
 * are closed on first paint anyway: render them in the browser only.
 */
export function Portal({ children }: { children: ReactNode }) {
  const hydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  return hydrated ? <ZagPortal>{children}</ZagPortal> : null;
}
