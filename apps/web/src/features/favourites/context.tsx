/**
 * Loved tracks and the obsession of the user whose page is shown. The owner can change them (and delete
 * listens) from any listen row; visitors only see the hearts.
 */
import { useRouter } from "@tanstack/react-router";
import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from "react";
import {
  api,
  isNotFound,
  type Favourite,
  type Listen,
  type Track,
  type TrackRef,
} from "../../api/index.ts";
import { forgetViewer } from "../../auth/index.ts";
import { useToast } from "../../ui/feedback/index.ts";
import { m } from "../../paraglide/messages.js";

export const trackKey = (artist: string, track: string) => `${artist}\u0000${track}`;

export const toRef = (t: Track): TrackRef => ({
  artist: t.artist,
  track: t.track,
  album: t.album ?? null,
  mbids: { recording: t.mbids?.recording ?? null, release: t.mbids?.release ?? null },
});

interface Favourites {
  owner: boolean;
  isLoved: (t: { artist: string; track: string }) => boolean;
  obsession: Favourite | null;
  isObsession: (t: { artist: string; track: string }) => boolean;
  toggleLove: (t: Track) => Promise<void>;
  toggleObsession: (t: Track) => Promise<void>;
  deleteListen: (l: Listen) => Promise<void>;
  /** Takes one obsession off the history; the current one also stops being the obsession. */
  removeObsession: (o: {
    id: number;
    artist: string;
    track: string;
    until: number | null;
  }) => Promise<void>;
  isRemovedObsession: (id: number) => boolean;
  /** Deleted here: lists that keep their own pages (history) hide them without reloading. */
  isDeleted: (l: Listen) => boolean;
}

const FavouritesContext = createContext<Favourites>({
  owner: false,
  isLoved: () => false,
  obsession: null,
  isObsession: () => false,
  toggleLove: async () => {},
  toggleObsession: async () => {},
  deleteListen: async () => {},
  removeObsession: async () => {},
  isRemovedObsession: () => false,
  isDeleted: () => false,
});

export function FavouritesProvider({
  owner,
  loved,
  obsession: initialObsession,
  children,
}: {
  owner: boolean;
  loved: Favourite[];
  obsession: Favourite | null;
  children: ReactNode;
}) {
  const router = useRouter();
  const toast = useToast();
  const [keys, setKeys] = useState(() => new Set(loved.map((f) => trackKey(f.artist, f.track))));
  const [obsession, setObsession] = useState(initialObsession);
  const [deleted, setDeleted] = useState(() => new Set<string>());
  const [removed, setRemoved] = useState(() => new Set<number>());
  const listenKey = (l: Listen) => `${l.listenedAt}/${l.id}`;

  const isLoved = useCallback(
    (t: { artist: string; track: string }) => keys.has(trackKey(t.artist, t.track)),
    [keys],
  );
  const isObsession = useCallback(
    (t: { artist: string; track: string }) =>
      obsession?.artist === t.artist && obsession.track === t.track,
    [obsession],
  );

  const value = useMemo<Favourites>(
    () => ({
      owner,
      isLoved,
      obsession,
      isObsession,
      async toggleLove(t) {
        const key = trackKey(t.artist, t.track);
        const was = keys.has(key);
        setKeys((k) => {
          const next = new Set(k);
          if (was) next.delete(key);
          else next.add(key);
          return next;
        });
        try {
          if (was) await api.favourites.unlove(t);
          else await api.favourites.love(toRef(t));
          toast(was ? m.loved_removed() : m.loved_added());
        } catch {
          setKeys((k) => {
            const next = new Set(k);
            if (was) next.add(key);
            else next.delete(key);
            return next;
          });
          toast(m.error_generic());
        }
      },
      async toggleObsession(t) {
        const previous = obsession;
        const clearing = isObsession(t);
        setObsession(
          clearing
            ? null
            : {
                artist: t.artist,
                track: t.track,
                album: t.album ?? null,
                mbids: { recording: t.mbids?.recording ?? null, release: t.mbids?.release ?? null },
                since: Date.now() / 1000,
              },
        );
        try {
          if (clearing) await api.favourites.clearObsession();
          else await api.favourites.setObsession(toRef(t));
          toast(clearing ? m.obsession_cleared() : m.obsession_set());
        } catch {
          setObsession(previous);
          toast(m.error_generic());
        }
      },
      isRemovedObsession: (id) => removed.has(id),
      async removeObsession(o) {
        const previous = obsession;
        const current = o.until === null && isObsession(o);
        setRemoved((r) => new Set(r).add(o.id));
        if (current) setObsession(null);
        try {
          if (current) await api.favourites.clearObsession();
          // Clearing may already drop a very short period: a missing one is gone, as asked.
          await api.favourites.deleteObsessionPeriod(o.id).catch((e: unknown) => {
            if (!(current && isNotFound(e))) throw e;
          });
          toast(m.obsession_removed());
          await router.invalidate();
        } catch {
          setRemoved((r) => {
            const next = new Set(r);
            next.delete(o.id);
            return next;
          });
          if (current) setObsession(previous);
          toast(m.error_generic());
        }
      },
      isDeleted: (l) => deleted.has(listenKey(l)),
      async deleteListen(l) {
        try {
          await api.listens.delete(l);
          setDeleted((d) => new Set(d).add(listenKey(l)));
          toast(m.listen_deleted());
          forgetViewer();
          await router.invalidate();
        } catch {
          toast(m.listen_delete_failed());
        }
      },
    }),
    [owner, isLoved, obsession, isObsession, keys, toast, router, deleted, removed],
  );

  return <FavouritesContext.Provider value={value}>{children}</FavouritesContext.Provider>;
}

export const useFavourites = () => useContext(FavouritesContext);
