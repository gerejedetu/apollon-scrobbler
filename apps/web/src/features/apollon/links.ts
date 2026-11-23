/**
 * Where things lead, for the design-system components (they take plain hrefs): an artist, album or track
 * page of a profile, each credited artist of a listen, a sleeve, and where to play a track.
 */
import { artworkUrl, lookupUrl, youtubeId } from "../../ui/cover/index.ts";
import { creditParts } from "../listens/TrackLinks.tsx";

const enc = encodeURIComponent;
const base = (userName: string) => `/u/${enc(userName)}`;

export const artistHref = (userName: string, artist: string) =>
  `${base(userName)}/artistes/${enc(artist)}`;

export const albumHref = (userName: string, artist: string, album: string) =>
  `${base(userName)}/albums/${enc(artist)}/${enc(album)}`;

export function trackHref(
  userName: string,
  t: { artist: string; track: string; album?: string | null },
): string {
  const q = t.album ? `?album=${enc(t.album)}` : "";
  return `${base(userName)}/titres/${enc(t.artist)}/${enc(t.track)}${q}`;
}

/** "Sickboyrari & Krisu": a link per credited artist, the separators as plain text. */
export const artistLinks = (userName: string, credit: string) =>
  creditParts(credit).map((p) => ({
    text: p.text,
    href: p.artist ? artistHref(userName, p.artist) : undefined,
  }));

interface Sleeve {
  artist: string;
  album?: string | null;
  track?: string | null;
  mbids?: { release?: string | null } | null;
  extra?: Record<string, unknown> | null;
}

/** The sleeve of a listen, album or track (the Worker's /covers; the generated art stands in on a miss). */
export const coverUrl = (t: Sleeve, size: 250 | 500 = 250): string | undefined =>
  artworkUrl(t.mbids?.release, size) ??
  lookupUrl(
    { kind: "album", artist: t.artist, album: t.album, track: t.track },
    size,
    youtubeId(t.extra?.origin_url),
  ) ??
  undefined;

export const artistImage = (artist: string, size: 250 | 500 = 500): string | undefined =>
  lookupUrl({ kind: "artist", artist }, size) ?? undefined;

/** The page the listen was played from when the player said so, else a YouTube Music search. */
export function playHref(t: Sleeve & { track: string }): string {
  const origin = t.extra?.origin_url;
  if (typeof origin === "string" && origin.startsWith("https://")) return origin;
  return `https://music.youtube.com/search?q=${enc(`${t.artist} ${t.track}`)}`;
}
