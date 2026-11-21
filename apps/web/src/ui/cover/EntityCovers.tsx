/** Sleeves and artist pictures for the screens: the right seed, MBID and name lookup in one place. */
import { Cover } from "./Cover.tsx";
import { albumSeed, artistSeed } from "./seeds.ts";

export function AlbumCover({
  artist,
  album,
  track,
  mbid,
  youtube,
  title,
  size,
}: {
  artist: string;
  album?: string | null;
  /** Used to find the album when only the track is known. */
  track?: string | null;
  mbid?: string | null;
  /** YouTube video the listen was played from: its thumbnail is the last resort. */
  youtube?: string | null;
  /** Printed on the pattern while there is no artwork. */
  title?: string;
  size?: number;
}) {
  return (
    <Cover
      seed={albumSeed(artist, album)}
      title={title}
      size={size}
      mbid={mbid}
      youtube={youtube}
      lookup={{ kind: "album", artist, album, track }}
    />
  );
}

export function ArtistCover({ artist, size }: { artist: string; size?: number }) {
  return <Cover seed={artistSeed(artist)} round size={size} lookup={{ kind: "artist", artist }} />;
}
