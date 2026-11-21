import { css } from "styled-system/css";
import type { Listen } from "../../api/index.ts";
import { FlameIcon, HeartIcon, TrashIcon } from "../../ui/icons.tsx";
import { ActionMenu } from "../../ui/zag/index.ts";
import { useFavourites } from "./context.tsx";
import { color } from "../../ui/theme/index.ts";
import { m } from "../../paraglide/messages.js";

/** The "⋯" of a listen, for its owner: love, obsession, delete. */
export function ListenActions({ listen, onDelete }: { listen: Listen; onDelete: () => void }) {
  const fav = useFavourites();
  if (!fav.owner) return null;
  const loved = fav.isLoved(listen);
  const obsession = fav.isObsession(listen);
  return (
    <ActionMenu
      label={m.listen_actions({ track: listen.track })}
      items={[
        {
          value: "love",
          label: loved ? m.unlove() : m.love(),
          icon: <HeartIcon color={color("danger")} filled={loved} />,
        },
        {
          value: "obsession",
          label: obsession ? m.obsession_clear() : m.obsession_make(),
          icon: <FlameIcon color={color("violet")} />,
        },
        {
          value: "delete",
          label: m.listen_delete(),
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
      aria-label={m.love()}
      className={css({ color: "violet", display: "inline-flex", flexShrink: 0 })}
    >
      <HeartIcon size={12} filled />
    </span>
  );
}
