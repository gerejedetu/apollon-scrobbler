/**
 * Who the token belongs to (GET /v1/me), remembered per isolate for as long as the API remembers a token
 * check (60 s), so a chat that calls several tools costs one extra API request, not one per call.
 */
import type { Endpoints, Me } from "@scrobbler/client";

const TTL_MS = 60_000;
const MAX_ENTRIES = 256;

export interface ViewerCache {
  get(key: string, now: number): Me | undefined;
  set(key: string, me: Me, now: number): void;
}

export function memoryViewerCache(ttlMs = TTL_MS, maxEntries = MAX_ENTRIES): ViewerCache {
  const entries = new Map<string, { me: Me; expires: number }>();
  return {
    get(key, now) {
      const hit = entries.get(key);
      if (!hit) return undefined;
      if (hit.expires <= now) {
        entries.delete(key);
        return undefined;
      }
      return hit.me;
    },
    set(key, me, now) {
      if (entries.size >= maxEntries) entries.delete(entries.keys().next().value as string);
      entries.set(key, { me, expires: now + ttlMs });
    },
  };
}

async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** The token owner's profile. Throws the API's 401 when the token is wrong. Keys never hold the raw token. */
export async function resolveViewer(
  api: Endpoints,
  authorization: string,
  cache: ViewerCache,
  now = Date.now(),
): Promise<Me> {
  const key = await sha256Hex(authorization);
  const cached = cache.get(key, now);
  if (cached) return cached;
  const me = await api.me.get();
  cache.set(key, me, now);
  return me;
}
