/**
 * History: the newest listens first, then older ones as the page scrolls (the API's "before" cursor).
 * `avant` starts the list at a date ("Aller à une date").
 */
import type { ListensPage } from "../../api/index.ts";

export const PAGE_SIZE = 50;

export interface HistorySearch {
  /** Listens strictly older than this (Unix seconds). */
  avant?: number;
}

export function parseHistorySearch(search: Record<string, unknown>): HistorySearch {
  const n = Number(search.avant);
  return { avant: Number.isInteger(n) && n > 0 ? n : undefined };
}

/** The "before" cursor of the page after `page`, or null once the oldest listen is shown. */
export function olderCursor(
  page: Pick<ListensPage, "listens" | "oldestListenedAt">,
): number | null {
  const last = page.listens.at(-1);
  return last && page.oldestListenedAt !== null && last.listenedAt > page.oldestListenedAt
    ? last.listenedAt
    : null;
}
