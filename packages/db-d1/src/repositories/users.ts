import type { UserRepository } from "@scrobbler/core";
import type { D1Like } from "../d1.ts";
import { toUser, USER_COLUMNS, type UserRow } from "../rows.ts";

export function d1Users(db: D1Like): UserRepository {
  const one = async (sql: string, ...params: unknown[]) => {
    const row = await db
      .prepare(sql)
      .bind(...params)
      .first<UserRow>();
    return row ? toUser(row) : null;
  };
  return {
    // `name` is COLLATE NOCASE, so this is an index lookup and case-insensitive.
    findByName: (name) => one(`SELECT ${USER_COLUMNS} FROM users WHERE name = ?1`, name),
    findByAuthId: (authUserId) =>
      one(`SELECT ${USER_COLUMNS} FROM users WHERE auth_user_id = ?1`, authUserId),
    create: (authUserId, name, createdAt) =>
      one(
        `INSERT INTO users (auth_user_id, name, created_at) VALUES (?1, ?2, ?3) ON CONFLICT DO NOTHING RETURNING ${USER_COLUMNS}`,
        authUserId,
        name,
        createdAt,
      ),
    setPrivate: (userId, isPrivate) =>
      one(
        `UPDATE users SET is_private = ?2 WHERE id = ?1 RETURNING ${USER_COLUMNS}`,
        userId,
        isPrivate ? 1 : 0,
      ),
    setAccent: (userId, accent) =>
      one(`UPDATE users SET accent = ?2 WHERE id = ?1 RETURNING ${USER_COLUMNS}`, userId, accent),
  };
}
