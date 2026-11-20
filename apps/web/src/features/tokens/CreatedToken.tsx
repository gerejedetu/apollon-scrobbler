import { css } from "styled-system/css";
import { WarningIcon } from "../../ui/icons.tsx";
import { Button } from "../../ui/primitives/index.ts";
import { CopyField } from "../../ui/zag/index.ts";

/** Shown once after creation: the secret, the server URL, and how to use them. */
export function CreatedToken({
  name,
  secret,
  serverUrl,
  onDone,
}: {
  name: string;
  secret: string;
  serverUrl: string;
  onDone: () => void;
}) {
  return (
    <section
      aria-label="Token créé"
      className={css({
        p: "24px",
        border: "2px solid token(colors.violet)",
        borderRadius: "card",
        bg: "violetSoft",
        display: "flex",
        flexDirection: "column",
        gap: "18px",
      })}
    >
      <div
        className={css({ display: "flex", gap: "12px", alignItems: "flex-start", color: "violet" })}
      >
        <WarningIcon />
        <div
          className={css({ display: "flex", flexDirection: "column", gap: "4px", color: "ink" })}
        >
          <b className={css({ fontSize: "14px", fontWeight: "600" })}>Token « {name} » créé</b>
          <span className={css({ fontSize: "13px", color: "violetInk" })}>
            Copie-le maintenant : il ne sera plus jamais affiché.
          </span>
        </div>
      </div>
      <CopyField label="Token" value={secret} emphasis />
      <div className={css({ display: "flex", flexDirection: "column", gap: "8px" })}>
        <CopyField label="URL du serveur" value={serverUrl} />
        <span className={css({ fontSize: "12px", color: "violetInk" })}>
          Colle ces deux valeurs dans ton appli de scrobbling. Elle se présente comme un serveur
          ListenBrainz : choisis ce type de serveur dans l'appli.
        </span>
      </div>
      <Button size="sm" onClick={onDone} className={css({ alignSelf: "flex-start" })}>
        C'est copié
      </Button>
    </section>
  );
}
