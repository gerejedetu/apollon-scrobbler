/**
 * The interface language (Paraglide: cookie, then browser preference, then French) as an Intl locale.
 * Formatters are cached per locale: on the server, two requests may want two languages.
 */
import { getLocale } from "../paraglide/runtime.js";

export const intlLocale = () => (getLocale() === "en" ? "en-GB" : "fr-FR");

const cache = new Map<string, Intl.DateTimeFormat | Intl.NumberFormat>();

export function dateFormat(options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const locale = intlLocale();
  const key = `d${locale}${JSON.stringify(options)}`;
  let f = cache.get(key) as Intl.DateTimeFormat | undefined;
  if (!f) cache.set(key, (f = new Intl.DateTimeFormat(locale, options)));
  return f;
}

export function numberFormat(options: Intl.NumberFormatOptions): Intl.NumberFormat {
  const locale = intlLocale();
  const key = `n${locale}${JSON.stringify(options)}`;
  let f = cache.get(key) as Intl.NumberFormat | undefined;
  if (!f) cache.set(key, (f = new Intl.NumberFormat(locale, options)));
  return f;
}
