import { css } from "styled-system/css";
import { WarningIcon } from "../../ui/icons.tsx";
import { Button } from "../../ui/primitives/index.ts";
import { CopyField } from "../../ui/zag/index.ts";
import { m } from "../../paraglide/messages.js";

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
      aria-label={m.token_created_aria()}
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
          <b className={css({ fontSize: "14px", fontWeight: "600" })}>
            {m.token_created({ name })}
          </b>
          <span className={css({ fontSize: "13px", color: "violetInk" })}>
            {m.token_copy_now()}
          </span>
        </div>
      </div>
      <CopyField label="Token" value={secret} emphasis />
      <div className={css({ display: "flex", flexDirection: "column", gap: "8px" })}>
        <CopyField label={m.server_url()} value={serverUrl} />
        <span className={css({ fontSize: "12px", color: "violetInk" })}>
          {m.token_paste_help()}
        </span>
      </div>
      <Button size="sm" onClick={onDone} className={css({ alignSelf: "flex-start" })}>
        {m.token_copied()}
      </Button>
    </section>
  );
}
