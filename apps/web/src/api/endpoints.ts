/** One function per /v1 operation the front uses. Paths and parameters mirror the OpenAPI document. */
import { type Http, segment } from "./http.ts";
import type * as T from "./types.ts";

const v1 = "/v1";

export function createEndpoints(http: Http) {
  const user = (name: string) => `${v1}/users/${segment(name)}`;
  return {
    me: {
      get: () => http.get<T.Me>(`${v1}/me`),
      update: (patch: { private?: boolean }) => http.patch<T.Me>(`${v1}/me`, patch),
    },
    listens: {
      list: (name: string, q: { before?: number; after?: number; limit?: number } = {}) =>
        http.get<T.ListensPage>(`${user(name)}/listens`, q),
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
