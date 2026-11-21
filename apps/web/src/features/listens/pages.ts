/**
 * History paging over the API's cursors: "before" (older) and "after" (newer, still newest first).
 * The page number is carried along so the pager can say "51–100" without an offset query.
 */
import type { ListensPage } from "../../api/index.ts";

export const PAGE_SIZES = [25, 50, 100] as const;
export type PageSize = (typeof PAGE_SIZES)[number];

export interface HistorySearch {
  /** Listens strictly older than this (Unix seconds). */
  avant?: number;
  /** Listens strictly newer than this. */
  apres?: number;
  /** 1-based page number, when known (not after jumping to a date). */
  page?: number;
  taille?: PageSize;
}

export function parseHistorySearch(search: Record<string, unknown>): HistorySearch {
  const int = (v: unknown) => {
    const n = Number(v);
    return Number.isInteger(n) && n >= 0 ? n : undefined;
  };
  const size = int(search.taille);
  return {
    avant: int(search.avant),
    apres: int(search.apres),
    page: int(search.page) || undefined,
    taille: PAGE_SIZES.includes(size as PageSize) ? (size as PageSize) : undefined,
  };
}

/** The search of the next (older) and previous (newer) pages of `page`. */
export function neighbours(page: ListensPage, search: HistorySearch, size: PageSize) {
  const first = page.listens[0];
  const last = page.listens.at(-1);
  const number = search.page;
  const atStart = number === 1 || (search.avant === undefined && search.apres === undefined);
  const older =
    last && page.oldestListenedAt !== null && last.listenedAt > page.oldestListenedAt
      ? { avant: last.listenedAt, page: number ? number + 1 : undefined, taille: size }
      : null;
  const newer =
    !atStart && first
      ? {
          apres: first.listenedAt,
          page: number && number > 1 ? number - 1 : undefined,
          taille: size,
        }
      : null;
  return { older, newer };
}

/** "1–50" for page 1 of 50. */
export function pageRange(number: number | undefined, size: number, count: number): string | null {
  if (!number || count === 0) return null;
  const from = (number - 1) * size + 1;
  return `${from}–${from + count - 1}`;
}

/** Page numbers to show around the current one: 1 … n-1 n n+1 … last. `null` is an ellipsis. */
export function pageNumbers(current: number, last: number): (number | null)[] {
  const wanted = new Set(
    [1, current - 1, current, current + 1, last].filter((n) => n >= 1 && n <= last),
  );
  const sorted = [...wanted].sort((a, b) => a - b);
  const out: (number | null)[] = [];
  for (const n of sorted) {
    const prev = out.at(-1);
    if (typeof prev === "number" && n - prev > 1) out.push(null);
    out.push(n);
  }
  return out;
}
