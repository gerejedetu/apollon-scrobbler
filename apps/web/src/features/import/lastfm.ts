/**
 * Last.fm exports (the CSV with `uts,utc_time,artist,artist_mbid,album,album_mbid,track,track_mbid`)
 * turned into listens for POST /v1/listens. Rows without artist, track or a valid time are skipped.
 */
import type { Track } from "../../api/index.ts";
import { parseCsv } from "./csv.ts";

export interface ListenToImport extends Track {
  listenedAt: number;
  /** Marks where the listen came from, shown in the history ("Import Last.fm"). */
  extra: { origin: "lastfm" };
}

export interface ParsedExport {
  listens: ListenToImport[];
  skipped: number;
  from: number | null;
  to: number | null;
}

const MBID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const mbid = (value: string | undefined) =>
  value && MBID.test(value.trim()) ? value.trim() : null;

export class NotALastFmExport extends Error {
  constructor() {
    super("Not a Last.fm export (expected columns: uts, artist, track).");
  }
}

export function parseLastFmExport(text: string): ParsedExport {
  const [header, ...rows] = parseCsv(text.replace(/^﻿/, ""));
  const col = (name: string) => header?.findIndex((h) => h.trim().toLowerCase() === name) ?? -1;
  const at = {
    uts: col("uts"),
    artist: col("artist"),
    artistMbid: col("artist_mbid"),
    album: col("album"),
    albumMbid: col("album_mbid"),
    track: col("track"),
    trackMbid: col("track_mbid"),
  };
  if (at.uts < 0 || at.artist < 0 || at.track < 0) throw new NotALastFmExport();

  const listens: ListenToImport[] = [];
  let skipped = 0;
  for (const r of rows) {
    const listenedAt = Number(r[at.uts]);
    const artist = r[at.artist]?.trim() ?? "";
    const track = r[at.track]?.trim() ?? "";
    if (!artist || !track || !Number.isInteger(listenedAt) || listenedAt <= 0) {
      skipped++;
      continue;
    }
    const artistMbid = mbid(r[at.artistMbid]);
    listens.push({
      artist,
      track,
      album: r[at.album]?.trim() || null,
      listenedAt,
      extra: { origin: "lastfm" },
      mbids: {
        recording: mbid(r[at.trackMbid]),
        release: mbid(r[at.albumMbid]),
        artists: artistMbid ? [artistMbid] : [],
      },
    });
  }
  const times = listens.map((l) => l.listenedAt);
  return {
    listens,
    skipped,
    from: times.length ? Math.min(...times) : null,
    to: times.length ? Math.max(...times) : null,
  };
}

/** POST /v1/listens takes up to 1000 listens per call. */
export const IMPORT_BATCH = 1000;

export function batches<T>(items: T[], size = IMPORT_BATCH): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}
