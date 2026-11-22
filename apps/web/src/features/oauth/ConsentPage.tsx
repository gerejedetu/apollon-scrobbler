import { useState } from "react";
import { css } from "styled-system/css";
import { authClient, oauthRedirect } from "../../auth/index.ts";
import { Button, Notice } from "../../ui/primitives/index.ts";
import { authFoot, authTitle } from "../auth/layout.tsx";
import { m } from "../../paraglide/messages.js";

const list = css({
  m: 0,
  pl: "20px",
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  fontSize: "13px",
});
const actions = css({ display: "flex", gap: "12px", mt: "8px", "& > *": { flex: 1 } });

/**
 * "Autoriser Claude ?": an MCP client asks for access to the account. The answer goes to Better Auth, which
 * sends the browser back to the client (with a code if allowed). The client name is what it claims to be.
 */
export function ConsentPage({
  clientName,
  userName,
}: {
  clientName: string | null;
  userName: string;
}) {
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const client = clientName?.trim() || m.consent_unknown_client();

  async function answer(accept: boolean) {
    setPending(true);
    setFailed(false);
    // The client plugin adds the signed query of this page (`oauth_query`).
    const { data, error } = await authClient.$fetch("/oauth2/consent", {
      method: "POST",
      body: { accept },
    });
    const next = error ? null : oauthRedirect(data);
    if (next) {
      window.location.assign(next);
      return;
    }
    setPending(false);
    setFailed(true);
  }

  return (
    <>
      <h1 className={authTitle} style={{ marginBottom: 8 }}>
        {m.consent_title({ client })}
      </h1>
      {failed ? <Notice tone="error">{m.consent_invalid()}</Notice> : null}
      <p className={css({ m: 0, fontSize: "13px" })}>{m.consent_body({ client })}</p>
      <ul className={list}>
        <li>{m.consent_read()}</li>
        <li>{m.consent_write()}</li>
      </ul>
      <div className={actions}>
        <Button tone="outline" disabled={pending} onClick={() => answer(false)}>
          {m.consent_deny()}
        </Button>
        <Button disabled={pending} onClick={() => answer(true)}>
          {pending ? m.consent_pending() : m.consent_allow()}
        </Button>
      </div>
      <p className={authFoot}>{m.consent_as({ user: userName })}</p>
    </>
  );
}
