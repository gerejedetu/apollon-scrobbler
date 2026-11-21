/** The product name, in one place: page titles, the wordmark, the manifest (public/site.webmanifest). */
export const APP_NAME = "Apollon";

/** "Stats de léa · Apollon": the page's own parts, most specific first, then the product name. */
export function pageTitle(...parts: string[]): string {
  return [...parts, APP_NAME].join(" · ");
}
