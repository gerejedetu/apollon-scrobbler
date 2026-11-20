import type { User } from "@scrobbler/types";
import { ApiError } from "../errors/index.ts";
import type { ImportRepository } from "../ports/index.ts";

const SERVICE_RE = /^[a-z0-9_-]{1,32}$/;

function assertService(service: unknown): asserts service is string {
  if (typeof service !== "string" || !SERVICE_RE.test(service)) {
    throw ApiError.badRequest("Invalid service: use a short lowercase name such as lastfm.");
  }
}

/** Tracks the timestamp of the newest listen imported from an outside service (used by importers to resume). */
export class ImportService {
  constructor(private readonly imports: ImportRepository) {}

  async latest(user: User, service: string | undefined): Promise<number> {
    const name = service ?? "lastfm";
    assertService(name);
    return this.imports.getLatest(user.id, name);
  }

  async update(user: User, body: unknown): Promise<void> {
    if (typeof body !== "object" || body === null)
      throw ApiError.badRequest("Invalid JSON document submitted.");
    const { ts, service = "lastfm" } = body as Record<string, unknown>;
    if (typeof ts !== "number" || !Number.isInteger(ts) || ts < 0) {
      throw ApiError.badRequest("ts must be a non-negative integer Unix timestamp.");
    }
    assertService(service);
    await this.imports.setLatest(user.id, service, ts);
  }
}
