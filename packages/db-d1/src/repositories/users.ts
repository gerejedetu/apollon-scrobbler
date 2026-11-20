import type { UserRepository } from "@scrobbler/core";
import type { D1Like } from "../d1.ts";
import { toUser, USER_COLUMNS, type UserRow } from "../rows.ts";

export function d1Users(db: D1Like): UserRepository {
  return {
    async findByName(name) {
      // `name` is COLLATE NOCASE, so this is an index lookup and case-insensitive.
      const row = await db.prepare(`SELECT ${USER_COLUMNS} FROM users WHERE name = ?1`).bind(name).first<UserRow>();
      return row ? toUser(row) : null;
    },
    async create(name, createdAt) {
      const row = await db
        .prepare(`INSERT INTO users (name, created_at) VALUES (?1, ?2) ON CONFLICT DO NOTHING RETURNING ${USER_COLUMNS}`)
        .bind(name, createdAt)
        .first<UserRow>();
      return row ? toUser(row) : null;
    },
  };
}
