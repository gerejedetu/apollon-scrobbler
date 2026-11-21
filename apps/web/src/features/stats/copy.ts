/** Words of the stats page that depend on the data. Pure, so they are tested on their own. */
import type { Range } from "../../api/index.ts";

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

/** The period in a sentence: "Ce mois-ci, tu as écouté…". */
export function rangeSentence(range: Range): string {
  switch (range) {
    case "this_week":
      return "Cette semaine";
    case "this_month":
      return "Ce mois-ci";
    case "this_year":
      return "Cette année";
    case "week":
      return "La semaine dernière";
    case "month":
      return "Le mois dernier";
    case "quarter":
      return "Le trimestre dernier";
    case "half_yearly":
      return "Le semestre dernier";
    case "year":
      return "L'an dernier";
    case "all_time":
      return "Depuis le début";
  }
}

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
