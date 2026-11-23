import { useNavigate } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import type { SearchResults as Results } from "../../api/index.ts";
import { Page, SearchField, SearchResults, TagList } from "../../ui/apollon/index.ts";
import { m } from "../../paraglide/messages.js";
import { albumHref, artistHref, artistImage, coverUrl, trackHref } from "./links.ts";

export type SearchOnly = "artists" | "albums" | "tracks";

/** Search in a profile's library (design system: PageSearch): artists, albums and titles by name. */
export function SearchPage({
  userName,
  query,
  only,
  results,
}: {
  userName: string;
  query: string;
  only?: SearchOnly;
  results: Results | null;
}) {
  const navigate = useNavigate();
  const [q, setQ] = useState(query);
  const filters: { label: string; value?: SearchOnly }[] = [
    { label: m.ds_all() },
    { label: m.tab_artists(), value: "artists" },
    { label: m.tab_albums(), value: "albums" },
    { label: m.tab_tracks(), value: "tracks" },
  ];
  const go = (next: { q?: string; seul?: SearchOnly }) =>
    void navigate({ to: "/u/$userName/recherche", params: { userName }, search: next });
  return (
    <Page>
      <div className="ap-search">
        <h1 className="ap-pagetitle">{m.ds_search_title()}</h1>
        <form
          role="search"
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            go({ q: q.trim() || undefined, seul: only });
          }}
        >
          <SearchField
            size="lg"
            value={q}
            autoFocus={!query}
            enterKeyHint="search"
            placeholder={m.ds_search_placeholder()}
            onChange={(e: { target: { value: string } }) => setQ(e.target.value)}
          />
        </form>
        <div className="ap-search__filters">
          <TagList
            tags={filters.map((f) => f.label)}
            selected={[filters.find((f) => f.value === only)?.label ?? filters[0]!.label]}
            onToggle={(label: string) =>
              go({ q: query || undefined, seul: filters.find((f) => f.label === label)?.value })
            }
          />
        </div>
        {results && query ? (
          <SearchResults
            data={{ ...results, query }}
            only={only}
            coverFor={(
              item: {
                artist: string;
                album?: string | null;
                track?: string;
                mbids?: { release?: string | null };
              },
              kind: SearchOnly,
            ) => (kind === "artists" ? artistImage(item.artist, 250) : coverUrl(item))}
            hrefFor={(
              item: { artist: string; album?: string | null; track?: string },
              kind: SearchOnly,
            ) =>
              kind === "artists"
                ? artistHref(userName, item.artist)
                : kind === "albums"
                  ? albumHref(userName, item.artist, item.album ?? "")
                  : trackHref(userName, {
                      artist: item.artist,
                      track: item.track ?? "",
                      album: item.album,
                    })
            }
          />
        ) : null}
      </div>
    </Page>
  );
}
