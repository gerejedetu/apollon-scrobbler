import { css } from "styled-system/css";
import type { Listen } from "../../api/index.ts";
import { FlameIcon, HeartIcon, TrashIcon } from "../../ui/icons.tsx";
import { ActionMenu } from "../../ui/zag/index.ts";
import { useFavourites } from "./context.tsx";

/** The "⋯" of a listen, for its owner: love, obsession, delete. */
export function ListenActions({ listen, onDelete }: { listen: Listen; onDelete: () => void }) {
  const fav = useFavourites();
  if (!fav.owner) return null;
  const loved = fav.isLoved(listen);
  const obsession = fav.isObsession(listen);
  return (
    <ActionMenu
      label={`Actions sur l'écoute de ${listen.track}`}
      items={[
        {
          value: "love",
          label: loved ? "Retirer des coups de cœur" : "Coup de cœur",
          icon: <HeartIcon color="#B4232A" filled={loved} />,
        },
        {
          value: "obsession",
          label: obsession ? "Ce n'est plus mon obsession" : "Mon obsession du moment",
          icon: <FlameIcon color="#6E44FF" />,
        },
        {
          value: "delete",
          label: "Supprimer cette écoute",
          icon: <TrashIcon />,
          tone: "danger",
          separated: true,
        },
      ]}
      onSelect={(value) => {
        if (value === "love") void fav.toggleLove(listen);
        if (value === "obsession") void fav.toggleObsession(listen);
        if (value === "delete") onDelete();
      }}
    />
  );
}

/** The small violet heart beside a loved track. */
export function LovedMark({ track }: { track: { artist: string; track: string } }) {
  const fav = useFavourites();
  if (!fav.isLoved(track)) return null;
  return (
    <span
      role="img"
      aria-label="Coup de cœur"
      className={css({ color: "violet", display: "inline-flex", flexShrink: 0 })}
    >
      <HeartIcon size={12} filled />
    </span>
  );
}
