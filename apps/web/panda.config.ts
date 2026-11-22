import { defineConfig } from "@pandacss/dev";
import {
  breakpoints,
  keyframes,
  semanticTokens,
  textStyles,
  tokens,
} from "./src/ui/theme/index.ts";

/** Apollon design system (see src/ui/theme). Generated code is git-ignored; `prepare` regenerates it. */
export default defineConfig({
  // Panda 2 injects no preset: base gives utilities, shorthands and conditions; tokens are all ours.
  presets: ["@pandacss/preset-base"],
  preflight: true,
  include: ["./src/**/*.{ts,tsx}"],
  exclude: ["./src/**/*.test.{ts,tsx}"],
  outdir: "styled-system",
  importMap: "styled-system",
  jsxFramework: "react",
  theme: { extend: { breakpoints, tokens, semanticTokens, textStyles, keyframes } },
  globalCss: {
    "html, body": { bg: "page", color: "ink", fontFamily: "body", fontSize: "14px" },
    a: { color: "ink" },
    "a:hover": { color: "violet" },
    button: { fontFamily: "inherit" },
    // Everything that reacts to a click shows the hand, Zag parts included (menu items, radios, tabs, switches).
    "a[href], button, summary, select, label[for], input[type=checkbox], input[type=radio], input[type=file], input[type=date]::-webkit-calendar-picker-indicator, [role=button], [role=tab], [role=menuitem], [role=menuitemradio], [role=option], [role=radio], [role=switch], [data-part=trigger], [data-part=item], [data-part=item-control], [data-part=control]":
      { cursor: "pointer" },
    "button:disabled, [aria-disabled=true], [data-disabled]": { cursor: "not-allowed" },
    // One focus ring everywhere (keyboard only): links, buttons, fields, Zag parts.
    ":focus-visible, [data-focus-visible]": {
      outline: "2px solid token(colors.focus)",
      outlineOffset: "2px",
    },
    "input::placeholder": { color: "placeholder" },
  },
});
