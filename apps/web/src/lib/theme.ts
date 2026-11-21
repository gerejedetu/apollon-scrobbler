/**
 * Light, dark or auto (follows the system). The choice lives in a cookie so the server renders the right
 * class on <html>; a tiny inline script resolves "auto" before the first paint (no flash).
 */
import { createIsomorphicFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

export type ThemePref = "light" | "dark" | "auto";
export const THEME_COOKIE = "theme";

export function themeFromCookie(cookie: string | null): ThemePref {
  const match = cookie
    ? new RegExp(`(?:^|;\\s*)${THEME_COOKIE}=(light|dark|auto)`).exec(cookie)
    : null;
  return (match?.[1] as ThemePref | undefined) ?? "auto";
}

export const initialTheme: () => ThemePref = createIsomorphicFn()
  .server(() => themeFromCookie(getRequest().headers.get("cookie")))
  .client(() => themeFromCookie(document.cookie));

/** Runs in <head> before paint: applies the stored choice, and keeps "auto" in sync with the system. */
export const THEME_SCRIPT = `(function(){var m=/(?:^|;\\s*)${THEME_COOKIE}=(light|dark|auto)/.exec(document.cookie);var p=m?m[1]:"auto";var q=matchMedia("(prefers-color-scheme: dark)");function a(){var d=p==="dark"||(p==="auto"&&q.matches);document.documentElement.classList.toggle("dark",d);document.documentElement.style.colorScheme=d?"dark":"light";}a();q.addEventListener("change",function(){var n=/(?:^|;\\s*)${THEME_COOKIE}=(light|dark|auto)/.exec(document.cookie);p=n?n[1]:"auto";a();});})();`;

export function applyTheme(pref: ThemePref): void {
  document.cookie = `${THEME_COOKIE}=${pref}; path=/; max-age=31536000; samesite=lax`;
  const dark =
    pref === "dark" || (pref === "auto" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
}
