/** French figures as Needle prints them: "1 204", "142k", "7,3 %". */
const integer = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });
const decimal = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 });

/** Intl puts a narrow no-break space between thousands; the design uses a no-break space. */
const tidy = (s: string) => s.replace(/ /g, " ");

export const formatCount = (n: number) => tidy(integer.format(n));

export function formatCompact(n: number): string {
  if (n < 100_000) return formatCount(n);
  if (n < 1_000_000) return `${Math.floor(n / 1000)}k`;
  return `${tidy(decimal.format(n / 1_000_000))}M`;
}

/** A share between 0 and 1 as a percentage: 0.073 → "7,3 %". */
export const formatShare = (share: number, digits = 1) =>
  `${tidy(new Intl.NumberFormat("fr-FR", { maximumFractionDigits: digits }).format(share * 100))} %`;

/** A signed change in percent: 12 → "+12 %", -3 → "−3 %". */
export function formatChange(percent: number): string {
  const rounded = Math.round(percent);
  const sign = rounded > 0 ? "+" : rounded < 0 ? "−" : "";
  return `${sign}${formatCount(Math.abs(rounded))} %`;
}

/** A width for a bar: `value` relative to `max`, as a CSS percentage. */
export const barWidth = (value: number, max: number) =>
  `${max > 0 ? Math.round((value / max) * 100) : 0}%`;

/** Ordinal used for milestones: 1 → "1re", 1000 → "1 000". */
export const formatMilestone = (n: number) => (n === 1 ? "1re" : formatCount(n));
