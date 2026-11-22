import { cva } from "styled-system/css";

/** Round filter chips (periods, years). Selected: black; others: grey. */
export const pill = cva({
  base: {
    height: "28px",
    px: "12px",
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    border: 0,
    borderRadius: "pill",
    fontSize: "12px",
    textDecoration: "none",
    whiteSpace: "nowrap",
  },
  variants: {
    tone: {
      off: { bg: "chip", color: "ink", _hover: { color: "ink", bg: "rule" } },
      on: { bg: "ink", color: "page", _hover: { color: "page" } },
      success: { bg: "successBg", color: "successInk", fontWeight: "500" },
    },
  },
  defaultVariants: { tone: "off" },
});
