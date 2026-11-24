/** One function per /v1 operation the front uses. Paths and parameters mirror the OpenAPI document. */
import { type Http, segment, withQuery } from "./http.ts";
import type * as T from "./types.ts";

const v1 = "/v1";
const auth = "/api/auth";

export function createEndpoints(http: Http) {
  const user = (name: string) => `${v1}/users/${segment(name)}`;
  return {
    /** ListenBrainz user tokens = Better Auth API keys of the signed-in account. */
    tokens: {
      list: async () =>
        (await http.get<{ apiKeys: T.ApiKey[] } | T.ApiKey[]>(`${auth}/api-key/list`)) as
          | { apiKeys: T.ApiKey[] }
          | T.ApiKey[],
      create: (name: string) => http.post<T.CreatedApiKey>(`${auth}/api-key/create`, { name }),
      delete: (keyId: string) =>
        http.post<{ success: boolean }>(`${auth}/api-key/delete`, { keyId }),
    },
    /** OAuth clients (MCP assistants) asking for access, as shown on the consent page. */
    oauth: {
      publicClient: (clientId: string) =>
        http.get<T.OAuthClientPublic>(`${auth}/oauth2/public-client`, { client_id: clientId }),
    },
    favourites: {
      loved: (name: string, q: { limit?: number; offset?: number } = {}) =>
        http.get<T.LovedPage>(`${user(name)}/loved`, q),
      love: (track: T.TrackRef) => http.put<void>(`${v1}/me/loved`, track),
      unlove: (track: { artist: string; track: string }) =>
        http.delete<void>(
          withQuery(`${v1}/me/loved`, { artist: track.artist, track: track.track }),
        ),
      obsession: (name: string) =>
        http.get<{ userName: string; obsession: T.Favourite | null }>(`${user(name)}/obsession`),
      search: (name: string, q: { q: string; limit?: number }) =>
        http.get<T.SearchResults>(`${user(name)}/search`, q),
      obsessions: (name: string, q: { limit?: number; offset?: number } = {}) =>
        http.get<T.ObsessionHistory>(`${user(name)}/obsessions`, q),
      setObsession: (track: T.TrackRef) => http.put<void>(`${v1}/me/obsession`, track),
      clearObsession: () => http.delete<void>(`${v1}/me/obsession`),
      deleteObsessionPeriod: (id: number) => http.delete<void>(`${v1}/me/obsessions/${id}`),
    },
    /** Instance settings: sign-up is open until the first account, then only if the owner reopens it. */
    instance: {
      /** Public: whether sign-up is open. */
      get: () => http.get<T.Instance>(`${v1}/instance`),
      /** Owner only (403 for anyone else). */
      settings: () => http.get<T.InstanceSettings>(`${v1}/instance/settings`),
      /** Owner only (403 for anyone else). */
      update: (patch: { signupOpen?: boolean }) =>
        http.patch<T.InstanceSettings>(`${v1}/instance`, patch),
    },
    me: {
      get: () => http.get<T.Me>(`${v1}/me`),
      update: (patch: { private?: boolean; accent?: string | null }) =>
        http.patch<T.Me>(`${v1}/me`, patch),
      /** Any profile's public card (name, member since, listen count, accent). */
      profile: (name: string) => http.get<T.Profile>(user(name)),
    },
    listens: {
      /** POST /v1/listens: up to 1000 at once; duplicates (same time and track) are ignored. `listenedAt`: Unix seconds or ISO 8601, default now. */
      submit: (
        listens: (T.Track & { listenedAt?: number | string; extra?: Record<string, unknown> })[],
      ) => http.post<{ accepted: number; inserted: number }>(`${v1}/listens`, { listens }),
      list: (name: string, q: { before?: number; after?: number; limit?: number } = {}) =>
        http.get<T.ListensPage>(`${user(name)}/listens`, q),
      /** DELETE /v1/listens/{listenedAt}/{id}: answers 204 even if it was already gone. */
      delete: (listen: { listenedAt: number; id: string }) =>
        http.delete<void>(`${v1}/listens/${listen.listenedAt}/${segment(listen.id)}`),
      nowPlaying: (name: string) => http.get<T.NowPlaying>(`${user(name)}/now-playing`),
    },
    stats: {
      top: (
        name: string,
        entity: T.Entity,
        q: { range?: T.Range; limit?: number; offset?: number },
      ) => http.get<T.Top>(`${user(name)}/stats/${entity}`, q),
      summary: (name: string, q: { range?: T.Range; utcOffset?: number }) =>
        http.get<T.Summary>(`${user(name)}/stats/summary`, q),
      activity: (
        name: string,
        q: { range?: T.Range; granularity?: T.Activity["granularity"]; utcOffset?: number },
      ) => http.get<T.Activity>(`${user(name)}/stats/activity`, q),
      clock: (name: string, q: { range?: T.Range; utcOffset?: number }) =>
        http.get<T.Clock>(`${user(name)}/stats/clock`, q),
      streaks: (name: string, q: { utcOffset?: number }) =>
        http.get<T.Streaks>(`${user(name)}/stats/streaks`, q),
      discoveries: (name: string, q: { range?: T.Range; limit?: number }) =>
        http.get<T.Discoveries>(`${user(name)}/stats/discoveries`, q),
      forgotten: (
        name: string,
        q: { months?: number; minListens?: number; entity?: T.Entity; limit?: number },
      ) => http.get<T.Forgotten>(`${user(name)}/stats/forgotten`, q),
      onRepeat: (name: string, q: { limit?: number }) =>
        http.get<T.OnRepeat>(`${user(name)}/stats/on-repeat`, q),
      trends: (name: string, q: { range?: T.Range; entity?: T.Entity; limit?: number }) =>
        http.get<T.Trends>(`${user(name)}/stats/trends`, q),
      compare: (name: string, q: { range?: T.Range }) =>
        http.get<T.Compare>(`${user(name)}/stats/compare`, q),
      oneShots: (name: string, q: { range?: T.Range; limit?: number }) =>
        http.get<T.OneShots>(`${user(name)}/stats/one-shots`, q),
      diversity: (name: string, q: { range?: T.Range }) =>
        http.get<T.Diversity>(`${user(name)}/stats/diversity`, q),
      albumSessions: (
        name: string,
        q: { range?: T.Range; minTracks?: number; gapMinutes?: number; limit?: number } = {},
      ) => http.get<T.AlbumSessions>(`${user(name)}/stats/album-sessions`, q),
      sessions: (name: string, q: { range?: T.Range; gapMinutes?: number }) =>
        http.get<T.Sessions>(`${user(name)}/stats/sessions`, q),
      milestones: (name: string) => http.get<T.Milestones>(`${user(name)}/stats/milestones`),
      onThisDay: (name: string, q: { date?: string; utcOffset?: number; limit?: number }) =>
        http.get<T.OnThisDay>(`${user(name)}/stats/on-this-day`, q),
      wrapped: (name: string, q: { year?: number; utcOffset?: number }) =>
        http.get<T.Wrapped>(`${user(name)}/stats/wrapped`, q),
    },
    library: {
      artist: (name: string, artist: string, q: { range?: T.Range; limit?: number } = {}) =>
        http.get<T.ArtistPage>(`${user(name)}/artists/${segment(artist)}`, q),
      timeline: (
        name: string,
        artist: string,
        q: { range?: T.Range; granularity?: T.Timeline["granularity"]; utcOffset?: number },
      ) => http.get<T.Timeline>(`${user(name)}/artists/${segment(artist)}/timeline`, q),
      album: (name: string, artist: string, album: string, q: { range?: T.Range } = {}) =>
        http.get<T.AlbumPage>(`${user(name)}/albums/${segment(artist)}/${segment(album)}`, q),
      track: (
        name: string,
        artist: string,
        track: string,
        q: { range?: T.Range; utcOffset?: number } = {},
      ) => http.get<T.TrackPage>(`${user(name)}/tracks/${segment(artist)}/${segment(track)}`, q),
    },
  };
}

export type Endpoints = ReturnType<typeof createEndpoints>;
