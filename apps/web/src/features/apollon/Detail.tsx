import type { AlbumPage, ArtistPage, Timeline, TrackPage } from "../../api/index.ts";
import { formatCount, formatDate } from "../../lib/format/index.ts";
import { dateFormat, intlLocale } from "../../lib/locale.ts";
import {
  AlbumGrid,
  Columns,
  EntityHero,
  FactList,
  LinkList,
  MoreLink,
  Page,
  SectionHeader,
  TopChart,
  TrendChart,
} from "../../ui/apollon/index.ts";
import { useFavourites } from "../favourites/index.ts";
import { m } from "../../paraglide/messages.js";
import {
  albumHref,
  artistHref,
  artistImage,
  artistLinks,
  coverUrl,
  playHref,
  trackHref,
} from "./links.ts";

// formatDate shifts to the viewer's offset first: the same text on the server and in the browser.
const longDate = (s: number | null) => (s ? formatDate(s) : null);
const shortMonth = (period: string) =>
  // A calendar month ("2026-11"), read in UTC so no time zone moves it.

  dateFormat({ month: "short", year: "2-digit", timeZone: "UTC" }).format(
    new Date(`${period}-01T00:00:00Z`),
  );

/** Facts with a value only: the API's nulls are left out, never "unknown". */
const facts = (list: { label: string; value: string | null | undefined }[]) =>
  list.filter((f): f is { label: string; value: string } => Boolean(f.value));

const search = (q: string) => encodeURIComponent(q);
const outbound = (
  q: string,
  mb: "artist" | "release" | "recording",
): { label: string; icon: "external" | "play"; href: string }[] => [
  {
    label: m.ds_open_musicbrainz(),
    icon: "external",
    href: `https://musicbrainz.org/search?type=${mb}&query=${search(q)}`,
  },
  {
    label: m.ds_search_youtube(),
    icon: "play",
    href: `https://music.youtube.com/search?q=${search(q)}`,
  },
];

/** An artist's page (design system: PageArtist): your counts, top tracks, albums, the timeline. */
export function ArtistDetail({
  userName,
  artist,
  timeline,
  totalListens,
}: {
  userName: string;
  artist: ArtistPage;
  timeline: Timeline;
  totalListens: number;
}) {
  const share = totalListens > 0 ? (artist.listenCount / totalListens) * 100 : 0;
  const top = artist.topTracks[0];
  return (
    <>
      <EntityHero
        kind="artist"
        title={artist.artist}
        imageUrl={artistImage(artist.artist)}
        playHref={`https://music.youtube.com/search?q=${search(artist.artist)}`}
        stats={[
          { label: m.ds_your_scrobbles(), value: artist.listenCount },
          { label: m.tab_tracks(), value: artist.trackCount },
          { label: m.tab_albums(), value: artist.albumCount },
        ]}
      />
      <Page>
        <Columns
          main={[
            <div key="facts" className="ap-detail__intro">
              {artist.firstListenedAt ? (
                <p className="ap-detail__lead">
                  {m.ds_artist_lead({
                    count: formatCount(artist.listenCount),
                    tracks: formatCount(artist.trackCount),
                    date: longDate(artist.firstListenedAt) ?? "",
                  })}
                  {top
                    ? ` ${m.ds_artist_lead_top({ track: top.track, count: formatCount(top.listenCount) })}`
                    : ""}
                </p>
              ) : (
                <p className="ap-detail__lead">{m.ds_nothing_yet()}</p>
              )}
              <FactList
                facts={facts([
                  { label: m.ds_first_listen(), value: longDate(artist.firstListenedAt) },
                  { label: m.ds_last_listen(), value: longDate(artist.lastListenedAt) },
                  {
                    label: m.ds_share_of_listens(),
                    value: share
                      ? `${share.toLocaleString(intlLocale(), { maximumFractionDigits: 1 })} %`
                      : null,
                  },
                ])}
              />
            </div>,
            artist.topTracks.length ? (
              <section key="tracks">
                <SectionHeader title={m.top_tracks()} size="sm" showPeriod={false} />
                <TopChart
                  entity="recordings"
                  unit={m.ds_scrobbles_unit()}
                  readOnly
                  items={artist.topTracks.map((t) => ({
                    artist: artist.artist,
                    track: t.track,
                    album: t.album,
                    listenCount: t.listenCount,
                  }))}
                  coverFor={(i: { artist: string; album?: string | null; track?: string | null }) =>
                    coverUrl(i)
                  }
                  hrefFor={(i: { artist: string; track?: string | null; album?: string | null }) =>
                    trackHref(userName, { artist: i.artist, track: i.track ?? "", album: i.album })
                  }
                />
              </section>
            ) : null,
            artist.albums.length ? (
              <section key="albums">
                <SectionHeader title={m.tab_albums()} size="sm" showPeriod={false} />
                <AlbumGrid
                  items={artist.albums.map((a) => ({
                    title: a.album,
                    meta: m.ds_album_meta({
                      listens: formatCount(a.listenCount),
                      tracks: formatCount(a.trackCount),
                    }),
                    coverUrl: coverUrl({
                      artist: artist.artist,
                      album: a.album,
                      mbids: { release: a.releaseMbid },
                    }),
                    href: albumHref(userName, artist.artist, a.album),
                  }))}
                />
                {artist.albumCount > artist.albums.length ? (
                  <MoreLink
                    href={`/u/${encodeURIComponent(userName)}/tops/albums?periode=all_time`}
                  >
                    {m.ds_more_albums()}
                  </MoreLink>
                ) : null}
              </section>
            ) : null,
          ].filter(Boolean)}
          side={[
            timeline.periods.length ? (
              <section key="chart">
                <SectionHeader title={m.ds_scrobble_stats()} size="sm" showPeriod={false} />
                <TrendChart
                  caption={m.ds_listens_by_month()}
                  points={timeline.periods.map((p) => ({
                    label: shortMonth(p.period),
                    tick: shortMonth(p.period),
                    value: p.listenCount,
                  }))}
                  tickEvery={3}
                />
              </section>
            ) : null,
            <section key="links">
              <SectionHeader title={m.ds_external_links()} size="sm" showPeriod={false} />
              <LinkList links={outbound(artist.artist, "artist")} />
            </section>,
          ].filter(Boolean)}
        />
      </Page>
    </>
  );
}

/** An album's page (design system: PageAlbum): the hanging cover, your counts, its tracks. */
export function AlbumDetail({
  userName,
  album,
  mbid,
}: {
  userName: string;
  album: AlbumPage;
  mbid?: string;
}) {
  const cover = coverUrl(
    { artist: album.artist, album: album.album, mbids: { release: mbid } },
    500,
  );
  return (
    <>
      <EntityHero
        kind="album"
        title={album.album}
        artist={album.artist}
        artistHref={artistHref(userName, album.artist)}
        coverUrl={cover}
        imageUrl={artistImage(album.artist)}
        playHref={`https://music.youtube.com/search?q=${search(`${album.artist} ${album.album}`)}`}
        stats={[
          { label: m.ds_your_scrobbles(), value: album.listenCount },
          { label: m.ds_tracks_played(), value: album.tracks.length },
        ]}
      />
      <Page>
        <Columns
          underCover
          main={[
            <FactList
              key="facts"
              facts={facts([
                { label: m.ds_first_listen(), value: longDate(album.firstListenedAt) },
                { label: m.ds_last_listen(), value: longDate(album.lastListenedAt) },
              ])}
            />,
            album.tracks.length ? (
              <section key="tracks">
                <SectionHeader title={m.ds_tracklist()} size="sm" showPeriod={false} />
                <TopChart
                  entity="recordings"
                  unit={m.ds_scrobbles_unit()}
                  readOnly
                  items={album.tracks.map((t) => ({
                    artist: album.artist,
                    track: t.trackName,
                    album: album.album,
                    listenCount: t.listenCount,
                  }))}
                  coverFor={() => cover}
                  hrefFor={(i: { track?: string | null }) =>
                    trackHref(userName, {
                      artist: album.artist,
                      track: i.track ?? "",
                      album: album.album,
                    })
                  }
                  artistLinks={() => artistLinks(userName, album.artist)}
                />
              </section>
            ) : (
              <p key="none" className="ap-detail__lead">
                {m.ds_nothing_yet()}
              </p>
            ),
          ]}
          side={[
            <section key="links">
              <SectionHeader title={m.ds_external_links()} size="sm" showPeriod={false} />
              <LinkList links={outbound(`${album.artist} ${album.album}`, "release")} />
            </section>,
          ]}
        />
      </Page>
    </>
  );
}

/** A track's page (design system: PageTrack): heart and obsession, your counts, month by month. */
export function TrackDetail({
  userName,
  track,
  album,
  mbid,
}: {
  userName: string;
  track: TrackPage;
  album?: string;
  mbid?: string;
}) {
  const fav = useFavourites();
  const t = { artist: track.artist, track: track.track, album: album ?? null };
  const cover = coverUrl({ ...t, mbids: { release: mbid } }, 500);
  return (
    <>
      <EntityHero
        kind="track"
        title={track.track}
        artist={track.artist}
        artistHref={artistHref(userName, track.artist)}
        coverUrl={cover}
        imageUrl={artistImage(track.artist)}
        playHref={playHref(t)}
        readOnly={!fav.owner}
        loved={fav.isLoved(t)}
        isObsession={fav.isObsession(t)}
        onToggleLove={() => void fav.toggleLove(t)}
        onObsession={() => void fav.toggleObsession(t)}
        stats={[{ label: m.ds_your_scrobbles(), value: track.listenCount }]}
      />
      <Page>
        <Columns
          underCover
          main={[
            <FactList
              key="facts"
              facts={facts([
                { label: m.ds_album(), value: album },
                { label: m.ds_first_listen(), value: longDate(track.firstListenedAt) },
                { label: m.ds_last_listen(), value: longDate(track.lastListenedAt) },
              ])}
            />,
            album ? (
              <section key="album">
                <SectionHeader title={m.ds_on_the_album()} size="sm" showPeriod={false} />
                <AlbumGrid
                  columns={2}
                  items={[
                    {
                      title: album,
                      artist: track.artist,
                      coverUrl: cover,
                      href: albumHref(userName, track.artist, album),
                    },
                  ]}
                />
              </section>
            ) : null,
          ].filter(Boolean)}
          side={[
            track.byMonth.length ? (
              <section key="chart">
                <SectionHeader title={m.ds_scrobble_stats()} size="sm" showPeriod={false} />
                <TrendChart
                  variant="bars"
                  caption={m.ds_listens_by_month()}
                  points={track.byMonth.map((p) => ({
                    label: shortMonth(p.period),
                    tick: shortMonth(p.period),
                    value: p.listenCount,
                  }))}
                  highlightLast
                />
              </section>
            ) : null,
            <section key="links">
              <SectionHeader title={m.ds_play_this_track()} size="sm" showPeriod={false} />
              <LinkList
                links={[
                  { label: "YouTube Music", icon: "play", href: playHref(t) },
                  {
                    label: "Spotify",
                    icon: "play",
                    href: `https://open.spotify.com/search/${search(`${track.artist} ${track.track}`)}`,
                  },
                  {
                    label: "Deezer",
                    icon: "play",
                    href: `https://www.deezer.com/search/${search(`${track.artist} ${track.track}`)}`,
                  },
                ]}
              />
            </section>,
          ].filter(Boolean)}
        />
      </Page>
    </>
  );
}
