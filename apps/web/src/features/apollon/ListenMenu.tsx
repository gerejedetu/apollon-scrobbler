import type { Listen } from "../../api/index.ts";
import { useFavourites } from "../favourites/index.ts";
import { m } from "../../paraglide/messages.js";
import { MenuButton } from "./MenuButton.tsx";

/** The owner's ⋮ on a listen: make it the obsession, delete it (immediate, as before). */
export function ListenMenu({ listen }: { listen: Listen }) {
  const fav = useFavourites();
  if (!fav.owner) return null;
  const obsession = fav.isObsession(listen);
  return (
    <MenuButton
      label={m.listen_actions({ track: listen.track })}
      items={[
        {
          label: obsession ? m.obsession_clear() : m.obsession_make(),
          icon: "target",
          onClick: () => void fav.toggleObsession(listen),
        },
        "-",
        {
          label: m.listen_delete(),
          icon: "trash",
          danger: true,
          onClick: () => void fav.deleteListen(listen),
        },
      ]}
    />
  );
}
