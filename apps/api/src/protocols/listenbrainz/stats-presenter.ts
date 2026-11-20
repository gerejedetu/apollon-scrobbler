/** Shapes core stats results like ListenBrainz's `/1/stats/user/{user}/{entity}` payloads. */
import type { StatsResult, TopRow, User } from "@scrobbler/types";

function artist(r: TopRow) {
  return {
    artist_mbid: r.artistMbids[0] ?? null,
    artist_mbids: r.artistMbids,
    artist_name: r.artistName,
    listen_count: r.listenCount,
  };
}

function recording(r: TopRow) {
  return {
    artist_mbids: r.artistMbids,
    artist_name: r.artistName,
    listen_count: r.listenCount,
    recording_mbid: r.recordingMbid,
    release_mbid: r.releaseMbid,
    release_name: r.releaseName,
    track_name: r.trackName,
  };
}

function release(r: TopRow) {
  return {
    artist_mbids: r.artistMbids,
    artist_name: r.artistName,
    listen_count: r.listenCount,
    release_mbid: r.releaseMbid,
    release_name: r.releaseName,
  };
}

function entityFields(result: StatsResult): Record<string, unknown> {
  switch (result.entity) {
    case "artists":
      return { artists: result.rows.map(artist), total_artist_count: result.total };
    case "recordings":
      return { recordings: result.rows.map(recording), total_recording_count: result.total };
    case "releases":
      return { releases: result.rows.map(release), total_release_count: result.total };
  }
}

export function presentStats(user: User, result: StatsResult, offset: number) {
  return {
    payload: {
      user_id: user.name,
      ...entityFields(result),
      count: result.rows.length,
      offset,
      range: result.range,
      from_ts: result.window.fromTs,
      to_ts: result.window.toTs,
      last_updated: result.lastUpdated,
    },
  };
}
