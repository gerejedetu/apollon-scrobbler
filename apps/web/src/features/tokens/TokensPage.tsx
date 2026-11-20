import { useRouter } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import { css } from "styled-system/css";
import { api, type ApiKey } from "../../api/index.ts";
import { Button, Field, Notice } from "../../ui/primitives/index.ts";
import { settingsTitle } from "../settings/index.ts";
import { CreatedToken } from "./CreatedToken.tsx";
import { TOKEN_NAME_MAX } from "./model.ts";
import { TokenList } from "./TokenList.tsx";

interface Created {
  id: string;
  name: string;
  secret: string;
}

/**
 * "Tokens d'API": one token per app that sends listens. A new token is shown once, with the server URL
 * to paste next to it (this site: it answers the ListenBrainz API at /1).
 */
export function TokensPage({ keys }: { keys: ApiKey[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [created, setCreated] = useState<Created | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setPending(true);
    setError(null);
    try {
      const key = await api.tokens.create(trimmed);
      setCreated({ id: key.id, name: key.name ?? trimmed, secret: key.key });
      setName("");
      await router.invalidate();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Le token n'a pas été créé.");
    } finally {
      setPending(false);
    }
  }

  async function revoke(key: ApiKey) {
    await api.tokens.delete(key.id);
    if (created?.id === key.id) setCreated(null);
    await router.invalidate();
  }

  return (
    <>
      <div className={css({ display: "flex", flexDirection: "column", gap: "8px" })}>
        <h1 className={settingsTitle}>Tokens d'API</h1>
        <p
          className={css({
            m: 0,
            maxWidth: "560px",
            fontSize: "13px",
            lineHeight: "20px",
            color: "muted",
          })}
        >
          Un token par appli qui envoie tes écoutes (lecteur, serveur, extension). Si une appli
          n'est plus utilisée, révoque son token.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className={css({ display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: "12px" })}
      >
        <Field
          label="Nom du token"
          name="name"
          placeholder="ex. Navidrome du salon"
          maxLength={TOKEN_NAME_MAX}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className={css({ flex: "1 1 280px" })}
        />
        <Button type="submit" disabled={pending || !name.trim()}>
          {pending ? "Création…" : "Créer le token"}
        </Button>
      </form>
      {error ? <Notice tone="error">{error}</Notice> : null}

      {created ? (
        <CreatedToken
          name={created.name}
          secret={created.secret}
          serverUrl={window.location.origin}
          onDone={() => setCreated(null)}
        />
      ) : null}

      <TokenList keys={keys} freshId={created?.id ?? null} onRevoke={revoke} />
    </>
  );
}
