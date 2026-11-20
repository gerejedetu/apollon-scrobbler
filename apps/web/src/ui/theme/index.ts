import { colors } from "./colors.ts";
import { fonts, textStyles } from "./typography.ts";

export { fontsHref } from "./typography.ts";
export { textStyles };

/** Corner radii: covers are always square, fields 4, buttons 6, cards 8, pills round. */
const radii = {
  cover: { value: "0" },
  field: { value: "4px" },
  button: { value: "6px" },
  card: { value: "8px" },
  pill: { value: "999px" },
};

export const tokens = { colors, fonts, radii };
export const semanticTokens = {};

/** Phone-first: below `sm` secondary columns (bars beside lists) are hidden. */
export const breakpoints = { sm: "640px", md: "768px", lg: "1024px" };
