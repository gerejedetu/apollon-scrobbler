import type { ReactNode } from "react";
import { cva } from "styled-system/css";

const notice = cva({
  base: { px: "14px", py: "12px", borderRadius: "field", fontSize: "13px" },
  variants: {
    tone: {
      success: { bg: "successBg", color: "successInk" },
      error: { bg: "dangerBg", color: "dangerInk" },
    },
  },
});

/** A status line: green for what worked, red (announced right away) for what did not. */
export function Notice({ tone, children }: { tone: "success" | "error"; children: ReactNode }) {
  return (
    <div role={tone === "error" ? "alert" : "status"} className={notice({ tone })}>
      {children}
    </div>
  );
}
