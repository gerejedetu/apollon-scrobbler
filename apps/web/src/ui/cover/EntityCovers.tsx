/** Sleeves and artist pictures for the screens: the MBID, name lookup and video in one place. */
import { Cover } from "./Cover.tsx";

export function AlbumCover({
  artist,
  album,
  track,
  mbid,
  youtube,
  size,
}: {
  artist: string;
  album?: string | null;
  /** Used to find the album when only the track is known. */
  track?: string | null;
  mbid?: string | null;
  /** YouTube video the listen was played from: its thumbnail is the last resort. */
  youtube?: string | null;
  size?: number;
}) {
  return (
    <Cover
      size={size}
      mbid={mbid}
      youtube={youtube}
      lookup={{ kind: "album", artist, album, track }}
    />
  );
}

export function ArtistCover({ artist, size }: { artist: string; size?: number }) {
  return <Cover round size={size} lookup={{ kind: "artist", artist }} />;
}
