import type { TokenRepository } from "@scrobbler/core";
import type { D1Like } from "../d1.ts";
import { toUser, type UserRow } from "../rows.ts";

export function d1Tokens(db: D1Like): TokenRepository {
  return {
    async findUserByTokenHash(tokenHash) {
      const row = await db
        .prepare("SELECT u.id, u.name, u.created_at, u.listen_count FROM api_tokens t JOIN users u ON u.id = t.user_id WHERE t.token_hash = ?1")
        .bind(tokenHash)
        .first<UserRow>();
      return row ? toUser(row) : null;
    },
    async add(userId, tokenHash, createdAt) {
      await db.prepare("INSERT INTO api_tokens (token_hash, user_id, created_at) VALUES (?1, ?2, ?3)").bind(tokenHash, userId, createdAt).run();
    },
    async revokeAll(userId) {
      await db.prepare("DELETE FROM api_tokens WHERE user_id = ?1").bind(userId).run();
    },
  };
}
