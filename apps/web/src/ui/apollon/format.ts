/**
 * Dates and numbers of the design-system components, in the page's language and the viewer's offset: the
 * same text on the server render and in the browser (the bundle used the machine's local time).
 */
import { dateFormat, intlLocale, numberFormat } from "../../lib/locale.ts";
import { utcOffset } from "../../lib/timezone.ts";
import { m } from "../../paraglide/messages.js";

/** A Unix time as a Date whose UTC fields are the viewer's local ones. */
const local = (ts: number) => new Date((ts + utcOffset() * 60) * 1000);

export function fmtNum(n: number | null | undefined): string {
  return n == null ? "" : numberFormat({ maximumFractionDigits: 0 }).format(Math.round(n));
}

export function fmtAgo(ts: number | null | undefined, now?: number): string {
  if (ts == null) return "";
  const at = now ?? Math.floor(Date.now() / 1000);
  const d = Math.max(0, at - ts);
  if (d < 60) return m.ago_now();
  const rtf = new Intl.RelativeTimeFormat(intlLocale(), { numeric: "always" });
  if (d < 3600) return rtf.format(-Math.floor(d / 60), "minute");
  if (d < 86400) return rtf.format(-Math.floor(d / 3600), "hour");
  const date = dateFormat({ day: "numeric", month: "short", timeZone: "UTC" }).format(local(ts));
  const time = dateFormat({ hour: "2-digit", minute: "2-digit", timeZone: "UTC" }).format(
    local(ts),
  );
  return `${date} ${time}`;
}

export function dayKey(ts: number): string {
  return local(ts).toISOString().slice(0, 10);
}

export function fmtDay(ts: number, now?: number): string {
  const at = now ?? Math.floor(Date.now() / 1000);
  if (dayKey(ts) === dayKey(at)) return m.today_title();
  if (dayKey(ts) === dayKey(at - 86400)) return m.yesterday_title();
  const text = dateFormat({
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(local(ts));
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function fmtDate(ts: number): string {
  return dateFormat({ day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(
    local(ts),
  );
}

/** "2026-11-20" (a calendar day from the API) as "20 nov." */
export function fmtIso(s: string | null | undefined): string {
  if (!s) return "";
  return dateFormat({ day: "numeric", month: "short", timeZone: "UTC" }).format(
    new Date(`${s}T00:00:00Z`),
  );
}
