/** Durations the French way: "71 h", "1 h 12", "6 h 40", "41 jours". */
export function formatHours(ms: number): string {
  return `${new Intl.NumberFormat("fr-FR").format(Math.round(ms / 3_600_000)).replace(/ /g, " ")} h`;
}

export function formatDuration(seconds: number): string {
  const total = Math.round(seconds / 60);
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${String(m).padStart(2, "0")}`;
}

export const formatDays = (n: number) => `${n} jour${n > 1 ? "s" : ""}`;

export const formatHour = (hour: number) => `${hour} h`;
