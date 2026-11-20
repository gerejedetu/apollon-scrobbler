/**
 * Conversions between the ListenBrainz wire format and stored listens.
 */
import type { ApiListen, NewListen, StoredListen, TrackMetadata } from "@scrobbler/types";
import { uuidV5 } from "../crypto/index.ts";
import { isMbid } from "./validate.ts";

/** Fixed namespace for recording MSIDs. Never change it: it would change every existing MSID. */
const MSID_NAMESPACE = "6f0b6c58-5a4b-4a8e-9a63-3f1d0c2c9b11";

/**
 * A deterministic "messy" recording id: the same artist / track / release always gives the same id,
 * which is what ListenBrainz clients expect from `recording_msid`.
 */
export function recordingMsid(meta: TrackMetadata): Promise<string> {
  const norm = (s: string | undefined) => (s ?? "").trim().toLowerCase();
  return uuidV5(`${norm(meta.artist_name)}\u0000${norm(meta.track_name)}\u0000${norm(meta.release_name)}`, MSID_NAMESPACE);
}

export async function toNewListen(listenedAt: number, meta: TrackMetadata): Promise<NewListen> {
  const info = { ...meta.additional_info };
  const msid = await recordingMsid(meta);
  delete info.recording_msid;
  return {
    listenedAt,
    recordingMsid: msid,
    artistName: meta.artist_name,
    trackName: meta.track_name,
    releaseName: meta.release_name ?? null,
    recordingMbid: isMbid(info.recording_mbid) ? info.recording_mbid.toLowerCase() : null,
    releaseMbid: isMbid(info.release_mbid) ? info.release_mbid.toLowerCase() : null,
    artistMbids: info.artist_mbids ?? [],
    additionalInfo: info,
  };
}

export function toApiListen(listen: StoredListen, userName: string): ApiListen {
  const trackMetadata: TrackMetadata = {
    artist_name: listen.artistName,
    track_name: listen.trackName,
    additional_info: { ...listen.additionalInfo, recording_msid: listen.recordingMsid },
  };
  if (listen.releaseName !== null) trackMetadata.release_name = listen.releaseName;
  return {
    inserted_at: listen.insertedAt,
    listened_at: listen.listenedAt,
    recording_msid: listen.recordingMsid,
    user_name: userName,
    track_metadata: trackMetadata,
  };
}
