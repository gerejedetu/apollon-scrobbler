import type { User } from "@scrobbler/types";
import { randomToken, sha256Hex } from "../crypto/index.ts";
import { ApiError } from "../errors/index.ts";
import type { Cache, Clock, TokenRepository, UserRepository } from "../ports/index.ts";
import { assertValidUserName } from "../users/service.ts";

/** How long a token lookup is remembered by the (per-isolate) auth cache. Revocation takes up to this long. */
const AUTH_CACHE_TTL = 60;

export interface IssuedToken {
  user: User;
  token: string;
}

/**
 * Reads the raw token from an `Authorization` header.
 * ListenBrainz uses `Token <uuid>`; `Bearer <uuid>` is accepted too.
 */
export function tokenFromHeader(header: string | undefined | null): string | null {
  if (!header) return null;
  const match = /^(?:Token|Bearer)\s+(\S+)\s*$/i.exec(header);
  return match?.[1] ?? null;
}

export class AuthService {
  constructor(
    private readonly users: UserRepository,
    private readonly tokens: TokenRepository,
    private readonly clock: Clock,
    private readonly cache?: Cache,
  ) {}

  /** Returns the token's owner, or null when the token is unknown. */
  async authenticate(rawToken: string): Promise<User | null> {
    const hash = await sha256Hex(rawToken);
    const key = `auth:${hash}`;
    const cached = await this.cache?.get<User>(key);
    if (cached) return cached;
    const user = await this.tokens.findUserByTokenHash(hash);
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

  async createUser(name: unknown): Promise<IssuedToken> {
    assertValidUserName(name);
    const now = this.clock();
    const user = await this.users.create(name, now);
    if (!user) throw new ApiError(409, `User ${name} already exists.`);
    const token = randomToken();
    await this.tokens.add(user.id, await sha256Hex(token), now);
    return { user, token };
  }

  /** Revokes every token of the user and issues a new one. */
  async resetToken(name: string): Promise<IssuedToken> {
    const user = await this.users.findByName(name);
    if (!user) throw ApiError.notFound(`Cannot find user: ${name}`);
    await this.tokens.revokeAll(user.id);
    const token = randomToken();
    await this.tokens.add(user.id, await sha256Hex(token), this.clock());
    return { user, token };
  }
}
