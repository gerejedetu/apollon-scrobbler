/** The product name, in one place: page titles, the wordmark, the manifest (public/site.webmanifest). */
export const APP_NAME = "Apollon";

/** Where the code lives (AGPL-3.0): linked from the footer. */
export const SOURCE_URL = "https://github.com/powpowchuuuu/stunning-winner";

/** "Stats de léa · Apollon": the page's own parts, most specific first, then the product name. */
export function pageTitle(...parts: string[]): string {
  return [...parts, APP_NAME].join(" · ");
}
