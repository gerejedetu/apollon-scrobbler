/**
 * When caching derived stats pays off.
 *
 * On Cloudflare, one KV write costs about as much as reading ~5,000 rows from D1, and one KV read about
 * 500 rows. Stats of a user with a small history are therefore cheaper to recompute than to cache, so
 * below this many listens the cache is skipped entirely (no read, no write).
 */
export const DEFAULT_CACHE_MIN_LISTENS = 5000;
