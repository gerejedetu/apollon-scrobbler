/**
 * The viewer's UTC offset in minutes, for the API's `utcOffset` (days and hours in local time).
 * The browser knows it; during server rendering it comes from a cookie the browser sets (0 until then).
 */
import { createIsomorphicFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

export const OFFSET_COOKIE = "utc_offset";

export const browserOffset = () => -new Date().getTimezoneOffset();

export function offsetFromCookie(cookie: string | null): number {
  const match = cookie ? new RegExp(`(?:^|;\\s*)${OFFSET_COOKIE}=(-?\\d+)`).exec(cookie) : null;
  const value = match ? Number(match[1]) : 0;
  return Number.isFinite(value) && Math.abs(value) <= 14 * 60 ? value : 0;
}

export const utcOffset: () => number = createIsomorphicFn()
  .server(() => offsetFromCookie(getRequest().headers.get("cookie")))
  .client(browserOffset);

/** Remembers the browser's offset for the next server render. */
export function rememberOffset(): void {
  document.cookie = `${OFFSET_COOKIE}=${browserOffset()}; path=/; max-age=31536000; samesite=lax`;
}
