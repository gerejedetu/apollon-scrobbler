import { defineConfig } from "@pandacss/dev";
import { tokens, semanticTokens, textStyles } from "./src/ui/theme/index.ts";

/** Needle design system (see src/ui/theme). Generated code is git-ignored; `prepare` regenerates it. */
export default defineConfig({
  // Panda 2 injects no preset: base gives utilities, shorthands and conditions; tokens are all ours.
  presets: ["@pandacss/preset-base"],
  preflight: true,
  include: ["./src/**/*.{ts,tsx}"],
  exclude: ["./src/**/*.test.{ts,tsx}"],
  outdir: "styled-system",
  importMap: "styled-system",
  jsxFramework: "react",
  theme: { extend: { tokens, semanticTokens, textStyles } },
  globalCss: {
    "html, body": { bg: "page", color: "ink", fontFamily: "body", fontSize: "14px" },
    a: { color: "ink" },
    "a:hover": { color: "violet" },
    button: { fontFamily: "inherit", cursor: "pointer" },
    "input::placeholder": { color: "placeholder" },
  },
});
