/** Minimal in-memory `Repositories` used to test services without a database. */
import type { FavouriteTrack, PlayingNow, StoredListen, TopRow, User } from "@scrobbler/types";
import type { InsightsRepository, Repositories, TokenVerifier } from "../src/index.ts";

/** Raw token -> account id, standing in for the identity provider. */
export function fakeVerifier(tokens: Map<string, string>): TokenVerifier {
  return { verify: async (raw) => tokens.get(raw) ?? null };
}

export function fakeRepositories(): Repositories & { _listens: StoredListen[] } {
  const users: (User & { authUserId: string })[] = [];
  const settings = new Map<string, string>();
  const aliases = new Map<string, string>();
  /** Bumped by every listen change, like users.data_version. */
  const version = { n: 0 };
  const listens: StoredListen[] = [];
  const playing = new Map<number, PlayingNow>();
  const imports = new Map<string, number>();

  const loved = new Map<string, FavouriteTrack>();
  const obsessions = new Map<number, FavouriteTrack>();
  const lovedKey = (userId: number, artist: string, track: string) =>
    `${userId}\u0000${artist}\u0000${track}`;
  return {
    _listens: listens,
    favourites: {
      async love(userId, t) {
        loved.set(lovedKey(userId, t.artistName, t.trackName), t);
      },
      async unlove(userId, artist, track) {
        loved.delete(lovedKey(userId, artist, track));
      },
      async loved(userId, limit, offset) {
        const mine = [...loved.entries()]
          .filter(([k]) => k.startsWith(`${userId}\u0000`))
          .map(([, t]) => t)
          .sort((a, b) => b.at - a.at);
        return { items: mine.slice(offset, offset + limit), total: mine.length };
      },
      async setObsession(userId, t) {
        if (t) obsessions.set(userId, t);
        else obsessions.delete(userId);
      },
      async obsession(userId) {
        return obsessions.get(userId) ?? null;
      },
    },
    users: {
      async findByName(name) {
        const u = users.find((x) => x.name.toLowerCase() === name.toLowerCase());
        return u
          ? {
              id: u.id,
              name: u.name,
              createdAt: u.createdAt,
              listenCount: listens.filter((l) => l.userId === u.id).length,
              isPrivate: u.isPrivate,
              dataVersion: version.n,
            }
          : null;
      },
      async findByAuthId(authUserId) {
        const u = users.find((x) => x.authUserId === authUserId);
        return u
          ? {
              id: u.id,
              name: u.name,
              createdAt: u.createdAt,
              listenCount: u.listenCount,
              isPrivate: u.isPrivate,
              dataVersion: version.n,
            }
          : null;
      },
      async create(authUserId, name, createdAt) {
        if (
          users.some(
            (u) => u.name.toLowerCase() === name.toLowerCase() || u.authUserId === authUserId,
          )
        )
          return null;
        const user = {
          id: users.length + 1,
          name,
          createdAt,
          listenCount: 0,
          isPrivate: false,
          dataVersion: version.n,
        };
        users.push({ ...user, authUserId });
        return user;
      },
      async setPrivate(userId, isPrivate) {
        const u = users.find((x) => x.id === userId);
        if (!u) return null;
        u.isPrivate = isPrivate;
        const { authUserId: _a, ...user } = u;
        return { ...user };
      },
    },
    listens: {
      async insertMany(userId, rows, insertedAt) {
        let n = 0;
        for (const r of rows) {
          if (
            listens.some(
              (l) =>
                l.userId === userId && l.listenedAt === r.listenedAt && l.trackName === r.trackName,
            )
          )
            continue;
          listens.push({ ...r, userId, insertedAt });
          n++;
          version.n++;
        }
        return n;
      },
      async page({ userId, minTs, maxTs, limit }) {
        const mine = listens
          .filter((l) => l.userId === userId)
          .sort((a, b) => b.listenedAt - a.listenedAt);
        let sel = mine.filter(
          (l) =>
            (maxTs === undefined || l.listenedAt < maxTs) &&
            (minTs === undefined || l.listenedAt > minTs),
        );
        sel = maxTs === undefined && minTs !== undefined ? sel.slice(-limit) : sel.slice(0, limit);
        return {
          listens: sel,
          latestListenTs: mine[0]?.listenedAt ?? null,
          oldestListenTs: mine.at(-1)?.listenedAt ?? null,
        };
      },
      async delete(userId, listenedAt, msid) {
        const i = listens.findIndex(
          (l) => l.userId === userId && l.listenedAt === listenedAt && l.recordingMsid === msid,
        );
        if (i < 0) return false;
        listens.splice(i, 1);
        version.n++;
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
    // Insights are SQL-heavy: they are tested against the real schema in db-d1 and apps/api, not faked here.
    artists: {
      async known(userId, names) {
        return new Set(
          names.filter((n) => listens.some((l) => l.userId === userId && l.artistName === n)),
        );
      },
      async aliases(names) {
        return new Map(
          names.flatMap((n) => (aliases.has(n) ? [[n, aliases.get(n)!] as [string, string]] : [])),
        );
      },
      async learnAliases(pairs) {
        for (const [a, b] of pairs) if (!aliases.has(a)) aliases.set(a, b);
      },
      async knownAlbums(userId, pairs) {
        return new Set(
          pairs
            .filter(([a, r]) =>
              listens.some((l) => l.userId === userId && l.artistName === a && l.releaseName === r),
            )
            .map(([a, r]) => `${a}\u0000${r}`),
        );
      },
    },
    instance: {
      async hasUsersAndSetting(key) {
        return [users.length > 0, settings.get(key) ?? null];
      },
      async setSetting(key, value) {
        settings.set(key, value);
      },
      async ownerUserId() {
        return users[0]?.id ?? null;
      },
    },
    insights: new Proxy({} as InsightsRepository, {
      get: () => () => Promise.reject(new Error("insights are not faked")),
    }),
    stats: {
      async activity({ userId, window, utcOffsetSeconds }) {
        const days = new Map<number, number>();
        for (const l of listens) {
          if (l.userId !== userId || l.listenedAt < window.fromTs || l.listenedAt > window.toTs)
            continue;
          const day = Math.floor((l.listenedAt + utcOffsetSeconds) / 86_400);
          days.set(day, (days.get(day) ?? 0) + 1);
        }
        return [...days]
          .sort((a, b) => a[0] - b[0])
          .map(([day, listenCount]) => ({ day, listenCount }));
      },
      async summary(userId, window) {
        const mine = listens.filter(
          (l) =>
            l.userId === userId && l.listenedAt >= window.fromTs && l.listenedAt <= window.toTs,
        );
        const times = mine.map((l) => l.listenedAt);
        return {
          listenCount: mine.length,
          artistCount: new Set(mine.map((l) => l.artistName)).size,
          recordingCount: new Set(mine.map((l) => `${l.artistName}|${l.trackName}`)).size,
          releaseCount: new Set(
            mine.filter((l) => l.releaseName).map((l) => `${l.artistName}|${l.releaseName}`),
          ).size,
          firstListenedAt: times.length ? Math.min(...times) : null,
          lastListenedAt: times.length ? Math.max(...times) : null,
        };
      },
      async artist({ userId, artistName, window, limit }) {
        const mine = listens.filter(
          (l) =>
            l.userId === userId &&
            l.artistName === artistName &&
            l.listenedAt >= window.fromTs &&
            l.listenedAt <= window.toTs,
        );
        if (mine.length === 0) return null;
        const byTrack = new Map<string, number>();
        for (const l of mine) byTrack.set(l.trackName, (byTrack.get(l.trackName) ?? 0) + 1);
        const tracks = [...byTrack].sort((a, b) => b[1] - a[1]);
        return {
          artistName,
          artistMbids: [],
          listenCount: mine.length,
          trackCount: tracks.length,
          albumCount: 0,
          albums: [],
          firstListenedAt: Math.min(...mine.map((l) => l.listenedAt)),
          lastListenedAt: Math.max(...mine.map((l) => l.listenedAt)),
          topTracks: tracks.slice(0, limit).map(([trackName, listenCount]) => ({
            trackName,
            releaseName: null,
            recordingMbid: null,
            listenCount,
          })),
        };
      },
      async top({ userId, window, limit, offset }) {
        const counts = new Map<string, TopRow>();
        for (const l of listens) {
          if (l.userId !== userId || l.listenedAt < window.fromTs || l.listenedAt > window.toTs)
            continue;
          const row = counts.get(l.artistName) ?? {
            artistName: l.artistName,
            artistMbids: [],
            trackName: null,
            releaseName: null,
            recordingMbid: null,
            releaseMbid: null,
            listenCount: 0,
          };
          row.listenCount++;
          counts.set(l.artistName, row);
        }
        const rows = [...counts.values()].sort((a, b) => b.listenCount - a.listenCount);
        return { rows: rows.slice(offset, offset + limit), total: rows.length };
      },
    },
  };
}
