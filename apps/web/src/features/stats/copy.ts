/** Words of the stats page that depend on the data. Pure, so they are tested on their own. */
import type { Range } from "../../api/index.ts";

/** "Tu es du soir." from the busiest hour, and the 4-hour window around it. */
export function dayPart(hour: number): { title: string; from: number; to: number } {
  if (hour >= 5 && hour < 12) return { title: "Tu es du matin.", from: 6, to: 10 };
  if (hour >= 12 && hour < 18) return { title: "Tu es de l'après-midi.", from: 13, to: 17 };
  if (hour >= 18) return { title: "Tu es du soir.", from: 20, to: 24 };
  return { title: "Tu es de la nuit.", from: 0, to: 4 };
}

/** Share of listens within [from, to) hours. */
export function shareBetween(hours: number[], from: number, to: number): number {
  const total = hours.reduce((a, b) => a + b, 0);
  if (total === 0) return 0;
  let part = 0;
  for (let h = from; h < to; h++) part += hours[h % 24] ?? 0;
  return part / total;
}

const WEEKDAY_NAMES: Record<string, string> = {
  monday: "lundi",
  tuesday: "mardi",
  wednesday: "mercredi",
  thursday: "jeudi",
  friday: "vendredi",
  saturday: "samedi",
  sunday: "dimanche",
  mon: "lundi",
  tue: "mardi",
  wed: "mercredi",
  thu: "jeudi",
  fri: "vendredi",
  sat: "samedi",
  sun: "dimanche",
};

/** The API's weekday name in French ("saturday" → "samedi"); unknown names pass through. */
export const weekdayName = (day: string) => WEEKDAY_NAMES[day.toLowerCase()] ?? day;

/** "sam", "lun"… for the weekday bars. */
export const weekdayShort = (day: string) => weekdayName(day).slice(0, 3);

/** What the previous period is called in "+12 % vs …". */
export function previousLabel(range: Range): string {
  switch (range) {
    case "this_week":
      return "la semaine dernière";
    case "this_month":
      return "le mois dernier";
    case "this_year":
      return "l'an dernier";
    case "week":
      return "la semaine d'avant";
    case "month":
      return "le mois d'avant";
    case "quarter":
      return "le trimestre d'avant";
    case "half_yearly":
      return "le semestre d'avant";
    case "year":
      return "l'année d'avant";
    case "all_time":
      return "la période d'avant";
  }
}

/** Ranges that run to now: the remaining days of the period are drawn as empty slots. */
export const isOngoing = (range: Range) => range.startsWith("this_");
