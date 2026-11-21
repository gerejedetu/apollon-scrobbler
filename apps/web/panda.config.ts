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
    button: { fontFamily: "inherit", cursor: "pointer" },
    "input::placeholder": { color: "placeholder" },
  },
});
