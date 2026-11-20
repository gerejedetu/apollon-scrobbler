/**
 * ListenBrainz API wire format (v1), as sent and received by clients.
 * Reference: https://listenbrainz.readthedocs.io/en/latest/users/api/
 */

export type ListenType = "single" | "playing_now" | "import";

/** Free-form extra data a client may attach to a listen. Known keys are typed; anything else passes through. */
export interface AdditionalInfo {
  artist_mbids?: string[];
  release_group_mbid?: string;
  release_mbid?: string;
  recording_mbid?: string;
  track_mbid?: string;
  work_mbids?: string[];
  tracknumber?: number | string;
  isrc?: string;
  spotify_id?: string;
  tags?: string[];
  media_player?: string;
  media_player_version?: string;
  submission_client?: string;
  submission_client_version?: string;
  music_service?: string;
  music_service_name?: string;
  origin_url?: string;
  duration_ms?: number;
  duration?: number;
  recording_msid?: string;
  [key: string]: unknown;
}

export interface TrackMetadata {
  artist_name: string;
  track_name: string;
  release_name?: string;
  additional_info?: AdditionalInfo;
  /** Present on responses when the listen was linked to MusicBrainz. */
  mbid_mapping?: MbidMapping | null;
}

export interface MbidMapping {
  recording_mbid?: string;
  release_mbid?: string;
  artist_mbids?: string[];
  caa_id?: number | null;
  caa_release_mbid?: string | null;
}

export interface SubmitListenItem {
  listened_at?: number;
  track_metadata: TrackMetadata;
}

export interface SubmitListensBody {
  listen_type: ListenType;
  payload: SubmitListenItem[];
}

/** One listen as returned by `GET /1/user/{user}/listens`. */
export interface ApiListen {
  inserted_at: number;
  listened_at: number;
  recording_msid: string;
  user_name: string;
  track_metadata: TrackMetadata;
}

export interface ApiError {
  code: number;
  error: string;
}

export type StatsRange =
  | "this_week"
  | "this_month"
  | "this_year"
  | "week"
  | "month"
  | "quarter"
  | "half_yearly"
  | "year"
  | "all_time";

export type StatsEntity = "artists" | "recordings" | "releases";
