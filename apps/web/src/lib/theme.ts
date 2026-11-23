/**
 * The viewer's theme: Jour (light), Nuit (dark), Marbre (marble), or "auto" (Jour or Nuit, as the system).
 * It is set as data-theme on <html> (the design system's tokens key off it). The choice lives in a cookie so
 * the server renders the right attribute; a tiny inline script resolves "auto" before the first paint.
 */
import { createIsomorphicFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

export type ThemePref = "light" | "dark" | "marble" | "auto";
export type Theme = Exclude<ThemePref, "auto">;
export const THEME_COOKIE = "theme";
const PATTERN = `(?:^|;\\s*)${THEME_COOKIE}=(light|dark|marble|auto)`;

export function themeFromCookie(cookie: string | null): ThemePref {
  const match = cookie ? new RegExp(PATTERN).exec(cookie) : null;
  return (match?.[1] as ThemePref | undefined) ?? "auto";
}

export const initialTheme: () => ThemePref = createIsomorphicFn()
  .server(() => themeFromCookie(getRequest().headers.get("cookie")))
  .client(() => themeFromCookie(document.cookie));

/** What the server can render: "auto" is unknown there, Jour until the script says otherwise. */
export const renderedTheme = (pref: ThemePref): Theme => (pref === "auto" ? "light" : pref);

/** Runs in <head> before paint: applies the stored choice, and keeps "auto" in sync with the system. */
export const THEME_SCRIPT = `(function(){var r=/${PATTERN}/;var q=matchMedia("(prefers-color-scheme: dark)");function a(){var m=r.exec(document.cookie);var p=m?m[1]:"auto";var t=p==="auto"?(q.matches?"dark":"light"):p;var e=document.documentElement;e.setAttribute("data-theme",t);e.classList.toggle("dark",t==="dark");}a();q.addEventListener("change",a);})();`;

export function resolveTheme(pref: ThemePref): Theme {
  if (pref !== "auto") return pref;
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyTheme(pref: ThemePref): void {
  document.cookie = `${THEME_COOKIE}=${pref}; path=/; max-age=31536000; samesite=lax`;
  const theme = resolveTheme(pref);
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.classList.toggle("dark", theme === "dark");
}
