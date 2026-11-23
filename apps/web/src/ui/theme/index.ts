import { semanticColors } from "./colors.ts";
import { fonts, textStyles } from "./typography.ts";

export { fontsHref } from "./typography.ts";
export { textStyles };

/** Corner radii: covers are always square, fields 4, buttons 6, cards 8, pills round. */
/** Corners from the design system: 3px at most, nothing round. */
const radii = {
  cover: { value: "var(--radius-0)" },
  field: { value: "var(--radius-2)" },
  button: { value: "var(--radius-3)" },
  card: { value: "var(--radius-3)" },
  pill: { value: "var(--radius-3)" },
};

export const tokens = { fonts, radii };
export const semanticTokens = { colors: semanticColors };

/** Phone-first: below `sm` secondary columns (bars beside lists) are hidden. */
export const breakpoints = { sm: "640px", md: "768px", lg: "1024px" };

/** The now-playing equalizer: each bar grows and shrinks from the bottom. */
export const keyframes = {
  equalize: {
    "0%, 100%": { transform: "scaleY(0.3)" },
    "50%": { transform: "scaleY(1)" },
  },
};

export type ColorName = keyof typeof semanticColors;
export { color } from "./vars.ts";
