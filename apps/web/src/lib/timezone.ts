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

/**
 * Runs first in <head>: when the cookie is missing or stale (first visit, travel, DST change), it stores the
 * browser's offset and reloads before anything is painted, so the server renders the same local times the
 * browser would and hydration matches. Reloads once at most per tab session (cookies blocked: no loop).
 */
export const OFFSET_SCRIPT = `(function(){try{var o=-new Date().getTimezoneOffset();var r=/(?:^|;\\s*)${OFFSET_COOKIE}=(-?\\d+)/;var m=r.exec(document.cookie);if(m&&Number(m[1])===o)return;document.cookie="${OFFSET_COOKIE}="+o+"; path=/; max-age=31536000; samesite=lax";var n=r.exec(document.cookie);if(!n||Number(n[1])!==o||sessionStorage.getItem("${OFFSET_COOKIE}_reload"))return;sessionStorage.setItem("${OFFSET_COOKIE}_reload","1");location.reload();}catch(e){}})();`;
