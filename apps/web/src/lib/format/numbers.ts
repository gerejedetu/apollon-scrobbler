/** Figures as Apollon prints them: "1 204" / "1,204", "142k", "7,3 %" / "7.3%". */
import { numberFormat } from "../locale.ts";

const integer = () => numberFormat({ maximumFractionDigits: 0 });
const decimal = () => numberFormat({ maximumFractionDigits: 1 });

/** Intl puts a narrow no-break space between thousands in French; the design uses a no-break space. */
const tidy = (s: string) => s.replace(/ /g, " ");

export const formatCount = (n: number) => tidy(integer().format(n));

export function formatCompact(n: number): string {
  if (n < 100_000) return formatCount(n);
  if (n < 1_000_000) return `${Math.floor(n / 1000)}k`;
  return `${tidy(decimal().format(n / 1_000_000))}M`;
}

/** A share between 0 and 1 as a percentage: 0.073 → "7,3 %" (fr) or "7.3%" (en). */
export const formatShare = (share: number, digits = 1) =>
  tidy(numberFormat({ style: "percent", maximumFractionDigits: digits }).format(share));

/** A signed change in percent: 12 → "+12 %", -3 → "−3 %". */
export function formatChange(percent: number): string {
  const rounded = Math.round(percent);
  const sign = rounded > 0 ? "+" : rounded < 0 ? "−" : "";
  return sign + formatShare(Math.abs(rounded) / 100, 0);
}

/** A width for a bar: `value` relative to `max`, as a CSS percentage. */
export const barWidth = (value: number, max: number) =>
  `${max > 0 ? Math.round((value / max) * 100) : 0}%`;
