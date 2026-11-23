import type { SearchResults, User } from "@scrobbler/types";
import { ApiError } from "../errors/index.ts";
import type { SearchRepository } from "../ports/index.ts";

const MAX_TEXT = 100;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

/** The library's search box: artists, albums and tracks of one user whose names contain the text. */
export class SearchService {
  constructor(private readonly repo: SearchRepository) {}

  async search(
    user: User,
    query: { q?: unknown; limit?: unknown },
  ): Promise<SearchResults & { query: string }> {
    const text = typeof query.q === "string" ? query.q.replace(/\s+/g, " ").trim() : "";
    if (!text) throw ApiError.badRequest("q is required.");
    if (text.length > MAX_TEXT)
      throw ApiError.badRequest(`q is too long (${MAX_TEXT} characters at most).`);
    const raw =
      query.limit === undefined || query.limit === "" ? DEFAULT_LIMIT : Number(query.limit);
    if (!Number.isInteger(raw) || raw < 1 || raw > MAX_LIMIT) {
      throw ApiError.badRequest(`limit must be an integer between 1 and ${MAX_LIMIT}.`);
    }
    return { query: text, ...(await this.repo.search(user.id, text, raw)) };
  }
}
