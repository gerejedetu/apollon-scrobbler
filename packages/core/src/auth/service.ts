import type { User } from "@scrobbler/types";
import { sha256Hex } from "../crypto/index.ts";
import { ApiError } from "../errors/index.ts";
import type { Cache, TokenVerifier, UserRepository } from "../ports/index.ts";

/** How long a token check is remembered by the (per-isolate) auth cache. Revocation takes up to this long. */
const AUTH_CACHE_TTL = 60;

/**
 * Reads the raw token from an `Authorization` header.
 * ListenBrainz uses `Token <token>`; `Bearer <token>` is accepted too.
 */
export function tokenFromHeader(header: string | undefined | null): string | null {
  if (!header) return null;
  const match = /^(?:Token|Bearer)\s+(\S+)\s*$/i.exec(header);
  return match?.[1] ?? null;
}

export class AuthService {
  constructor(
    private readonly users: UserRepository,
    private readonly verifier: TokenVerifier,
    private readonly cache?: Cache,
  ) {}

  /** Returns the token's owner, or null when the token is unknown, revoked or expired. */
  async authenticate(rawToken: string): Promise<User | null> {
    // Cache keys never hold the raw token.
    const key = `auth:${await sha256Hex(rawToken)}`;
    const cached = await this.cache?.get<User>(key);
    if (cached) return cached;
    const authUserId = await this.verifier.verify(rawToken);
    if (!authUserId) return null;
    const user = await this.users.findByAuthId(authUserId);
    if (user) await this.cache?.set(key, user, AUTH_CACHE_TTL);
    return user;
  }

  async requireUser(header: string | undefined | null): Promise<User> {
    const raw = tokenFromHeader(header);
    if (!raw) throw ApiError.unauthorized("You need to provide an Authorization header.");
    const user = await this.authenticate(raw);
    if (!user) throw ApiError.unauthorized();
    return user;
  }
}
