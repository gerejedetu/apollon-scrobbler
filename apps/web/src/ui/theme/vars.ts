import { token } from "styled-system/tokens";
import type { ColorName } from "./index.ts";

/** A theme colour for inline styles (computed values): follows light and dark like the `css()` tokens. */
export const color = (name: ColorName) => token.var(`colors.${name}`);
