/** Dates in French, short like the design: "12 janv. 2019", "15 nov.", "il y a 6 min". */
const DAY = 86_400;

const dayMonthYear = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  year: "numeric",
});
const dayMonth = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" });
const monthYear = new Intl.DateTimeFormat("fr-FR", { month: "short", year: "numeric" });
const monthLong = new Intl.DateTimeFormat("fr-FR", { month: "long" });
const clock = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" });
const weekdayShort = new Intl.DateTimeFormat("fr-FR", { weekday: "short" });

const fromUnix = (seconds: number) => new Date(seconds * 1000);
/** "1 nov." → "1er nov.", as French typography wants. */
const firstOfMonth = (s: string) => s.replace(/^1 /, "1er ");

export const formatDate = (seconds: number) => firstOfMonth(dayMonthYear.format(fromUnix(seconds)));
export const formatDayMonth = (seconds: number) => firstOfMonth(dayMonth.format(fromUnix(seconds)));
export const formatMonthYear = (seconds: number) => monthYear.format(fromUnix(seconds));
export const formatTime = (seconds: number) => clock.format(fromUnix(seconds));

/** A calendar date string from the API ("2026-11-15") read as a local date. */
export function parseDay(date: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

export const formatDayString = (date: string) => firstOfMonth(dayMonth.format(parseDay(date)));
export const formatDayStringWithYear = (date: string) =>
  firstOfMonth(dayMonthYear.format(parseDay(date)));
export const formatWeekday = (date: string) => weekdayShort.format(parseDay(date));

/** "2025-05" → "mai 2025". */
export function formatPeriodMonth(period: string): string {
  const [y, m] = period.split("-").map(Number);
  return monthYear.format(new Date(y ?? 1970, (m ?? 1) - 1, 1));
}

/** "2025-05" → "Mai". */
export function formatMonthName(period: string): string {
  const [y, m] = period.split("-").map(Number);
  const name = monthLong.format(new Date(y ?? 1970, (m ?? 1) - 1, 1));
  return name.charAt(0).toUpperCase() + name.slice(1);
}

/** How long ago, for lists of listens: "à l'instant", "il y a 6 min", "il y a 3 h", "hier", "il y a 4 j". */
export function formatAgo(seconds: number, now = Date.now() / 1000): string {
  const diff = Math.max(0, now - seconds);
  if (diff < 60) return "à l'instant";
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < DAY) return `il y a ${Math.floor(diff / 3600)} h`;
  if (diff < 2 * DAY) return "hier";
  if (diff < 30 * DAY) return `il y a ${Math.floor(diff / DAY)} j`;
  return formatDate(seconds);
}

/** Listens of today show the clock time ("18:42"), older ones how long ago. */
export function formatListenedAt(seconds: number, now = Date.now() / 1000): string {
  const diff = now - seconds;
  if (diff < 3600) return formatAgo(seconds, now);
  if (new Date(seconds * 1000).toDateString() === new Date(now * 1000).toDateString())
    return formatTime(seconds);
  return formatAgo(seconds, now);
}
