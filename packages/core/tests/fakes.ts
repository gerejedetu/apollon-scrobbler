/** Minimal in-memory `Repositories` used to test services without a database. */
import type { PlayingNow, StoredListen, TopRow, User } from "@scrobbler/types";
import type { Repositories } from "../src/index.ts";

export function fakeRepositories(): Repositories & { _listens: StoredListen[] } {
  const users: User[] = [];
  const tokens = new Map<string, number>();
  const listens: StoredListen[] = [];
  const playing = new Map<number, PlayingNow>();
  const imports = new Map<string, number>();
  const byId = (id: number) => users.find((u) => u.id === id) ?? null;

  return {
    _listens: listens,
    users: {
      async findByName(name) {
        const u = users.find((x) => x.name.toLowerCase() === name.toLowerCase());
        return u ? { ...u, listenCount: listens.filter((l) => l.userId === u.id).length } : null;
      },
      async create(name, createdAt) {
        if (users.some((u) => u.name.toLowerCase() === name.toLowerCase())) return null;
        const user = { id: users.length + 1, name, createdAt, listenCount: 0 };
        users.push(user);
        return user;
      },
    },
    tokens: {
      async findUserByTokenHash(hash) {
        const id = tokens.get(hash);
        return id === undefined ? null : byId(id);
      },
      async add(userId, hash) {
        tokens.set(hash, userId);
      },
      async revokeAll(userId) {
        for (const [h, id] of tokens) if (id === userId) tokens.delete(h);
      },
    },
    listens: {
      async insertMany(userId, rows, insertedAt) {
        let n = 0;
        for (const r of rows) {
          if (listens.some((l) => l.userId === userId && l.listenedAt === r.listenedAt && l.trackName === r.trackName)) continue;
          listens.push({ ...r, userId, insertedAt });
          n++;
        }
        return n;
      },
      async page({ userId, minTs, maxTs, limit }) {
        const mine = listens.filter((l) => l.userId === userId).sort((a, b) => b.listenedAt - a.listenedAt);
        let sel = mine.filter((l) => (maxTs === undefined || l.listenedAt < maxTs) && (minTs === undefined || l.listenedAt > minTs));
        sel = maxTs === undefined && minTs !== undefined ? sel.slice(-limit) : sel.slice(0, limit);
        return { listens: sel, latestListenTs: mine[0]?.listenedAt ?? null, oldestListenTs: mine.at(-1)?.listenedAt ?? null };
      },
      async delete(userId, listenedAt, msid) {
        const i = listens.findIndex((l) => l.userId === userId && l.listenedAt === listenedAt && l.recordingMsid === msid);
        if (i < 0) return false;
        listens.splice(i, 1);
        return true;
      },
    },
    playingNow: {
      async set(entry) {
        playing.set(entry.userId, entry);
      },
      async get(userId, now) {
        const e = playing.get(userId);
        return e && e.expiresAt > now ? e : null;
      },
    },
    imports: {
      async getLatest(userId, service) {
        return imports.get(`${userId}:${service}`) ?? 0;
      },
      async setLatest(userId, service, ts) {
        imports.set(`${userId}:${service}`, ts);
      },
    },
    stats: {
      async top({ userId, window, limit, offset }) {
        const counts = new Map<string, TopRow>();
        for (const l of listens) {
          if (l.userId !== userId || l.listenedAt < window.fromTs || l.listenedAt > window.toTs) continue;
          const row = counts.get(l.artistName) ?? { artistName: l.artistName, artistMbids: [], trackName: null, releaseName: null, recordingMbid: null, releaseMbid: null, listenCount: 0 };
          row.listenCount++;
          counts.set(l.artistName, row);
        }
        const rows = [...counts.values()].sort((a, b) => b.listenCount - a.listenCount);
        return { rows: rows.slice(offset, offset + limit), total: rows.length };
      },
    },
  };
}
