import type { ButtonHTMLAttributes } from "react";
import { cva, cx, type RecipeVariantProps } from "styled-system/css";

/** Buttons of the design: black primary, violet accent, white outline, red danger. */
export const button = cva({
  base: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    border: 0,
    borderRadius: "button",
    fontSize: "13px",
    fontWeight: "500",
    whiteSpace: "nowrap",
    textDecoration: "none",
    _disabled: { opacity: 0.5, cursor: "not-allowed" },
  },
  variants: {
    tone: {
      primary: { bg: "ink", color: "page", _hover: { color: "page", bg: "#2A2A2A" } },
      accent: { bg: "violet", color: "page", _hover: { color: "page", bg: "violetHover" } },
      outline: {
        bg: "page",
        color: "ink",
        border: "1px solid token(colors.dashed)",
        _hover: { color: "ink", borderColor: "ink" },
      },
      soft: {
        bg: "page",
        color: "ink",
        border: "1px solid token(colors.violetLine)",
        _hover: { color: "ink", borderColor: "violet" },
      },
      danger: { bg: "danger", color: "page", _hover: { color: "page", bg: "dangerInk" } },
    },
    size: {
      md: { height: "40px", px: "16px" },
      sm: { height: "36px", px: "14px" },
      xs: { height: "30px", px: "12px", fontSize: "12px" },
    },
  },
  defaultVariants: { tone: "primary", size: "md" },
});

export type ButtonVariants = RecipeVariantProps<typeof button>;

export function Button({
  tone,
  size,
  className,
  type = "button",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & ButtonVariants) {
  return <button type={type} className={cx(button({ tone, size }), className)} {...rest} />;
}
