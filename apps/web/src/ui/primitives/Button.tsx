import type { ButtonHTMLAttributes } from "react";
import { cva, cx, type RecipeVariantProps } from "styled-system/css";

/** Buttons of the design: black primary, violet accent, outline, red danger; two sizes, nothing ad hoc. */
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
      primary: { bg: "ink", color: "onInk", _hover: { color: "onInk", bg: "inkHover" } },
      accent: { bg: "violet", color: "page", _hover: { color: "page", bg: "violetHover" } },
      outline: {
        bg: "transparent",
        color: "ink",
        border: "1px solid token(colors.control)",
        _hover: { color: "ink", borderColor: "focus" },
      },
      soft: {
        bg: "transparent",
        color: "ink",
        border: "1px solid token(colors.violetLine)",
        _hover: { color: "ink", borderColor: "focus" },
      },
      danger: { bg: "danger", color: "page", _hover: { color: "page", bg: "dangerInk" } },
    },
    size: {
      /** Forms and main actions. */
      md: { height: "40px", px: "16px" },
      /** Toolbars, rows and headers: the height of the dropdowns beside them. */
      sm: { height: "32px", px: "12px" },
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
