import { useNavigate, useRouter } from "@tanstack/react-router";
import { type ReactNode, useState } from "react";
import { css } from "styled-system/css";
import { api, type Me } from "../../api/index.ts";
import { authClient, forgetViewer } from "../../auth/index.ts";
import { formatCount } from "../../lib/format/index.ts";
import { CheckIcon, SignOutIcon } from "../../ui/icons.tsx";
import { Button, Notice } from "../../ui/primitives/index.ts";
import { Switch } from "../../ui/zag/index.ts";
import { settingsTitle } from "./SettingsLayout.tsx";

const fullDate = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const group = css({ display: "flex", flexDirection: "column", gap: "8px" });
const fieldLabel = css({ fontSize: "15px", fontWeight: "500" });
const help = css({ m: 0, fontSize: "13px", lineHeight: "20px", color: "muted" });

function ReadOnly({ children }: { children: ReactNode }) {
  return (
    <div
      aria-readonly="true"
      className={css({
        height: "44px",
        px: "14px",
        display: "flex",
        alignItems: "center",
        borderRadius: "button",
        bg: "field",
        fontSize: "14px",
        color: "placeholder",
      })}
    >
      {children}
    </div>
  );
}

type SaveState = "idle" | "saving" | "saved" | "failed";

/** "Profil" settings: name, membership, the private switch (PATCH /v1/me) and sign-out. */
export function ProfileSettings({ me }: { me: Me }) {
  const router = useRouter();
  const navigate = useNavigate();
  const [isPrivate, setPrivate] = useState(me.private);
  const [state, setState] = useState<SaveState>("idle");
  const [leaving, setLeaving] = useState(false);

  async function toggle(next: boolean) {
    setPrivate(next);
    setState("saving");
    try {
      const saved = await api.me.update({ private: next });
      setPrivate(saved.private);
      setState("saved");
      forgetViewer();
      await router.invalidate();
    } catch {
      setPrivate(!next);
      setState("failed");
    }
  }

  async function signOut() {
    setLeaving(true);
    await authClient.signOut();
    forgetViewer();
    await navigate({ to: "/connexion" });
    await router.invalidate();
  }

  return (
    <>
      <h1 className={settingsTitle}>Profil</h1>
      <div className={group}>
        <span className={fieldLabel}>Nom d'utilisateur</span>
        <ReadOnly>{me.userName}</ReadOnly>
        <p className={help}>
          Il apparaît dans l'adresse de ton profil : needle/
          <b className={css({ color: "ink", fontWeight: "500" })}>{me.userName}</b>
        </p>
      </div>
      <div className={group}>
        <span className={fieldLabel}>Membre depuis</span>
        <ReadOnly>
          {fullDate.format(new Date(me.createdAt * 1000))} · {formatCount(me.listenCount)} écoutes
        </ReadOnly>
      </div>
      <div className={css({ display: "flex", flexDirection: "column", gap: "12px" })}>
        <div className={css({ display: "flex", flexDirection: "column", gap: "4px" })}>
          <span className={fieldLabel}>Visibilité du profil</span>
          <p className={help}>
            Activé, tes écoutes et tes stats ne sont visibles que par toi, une fois connecté.
            Désactivé, n'importe qui avec l'adresse de ton profil peut les voir.
          </p>
        </div>
        <Switch
          label="Profil privé"
          checked={isPrivate}
          disabled={state === "saving"}
          onCheckedChange={toggle}
        />
        {state === "saved" ? (
          <span
            role="status"
            className={css({
              fontSize: "12px",
              color: "successInk",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            })}
          >
            <CheckIcon />
            Enregistré
          </span>
        ) : null}
        {state === "failed" ? (
          <Notice tone="error">Le réglage n'a pas été enregistré. Réessaie.</Notice>
        ) : null}
      </div>
      <div
        className={css({
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          pt: "24px",
          borderTop: "1px solid token(colors.rule)",
        })}
      >
        <div className={css({ display: "flex", flexDirection: "column", gap: "4px" })}>
          <span className={fieldLabel}>Se déconnecter</span>
          <p className={help}>
            Tes tokens d'API continuent de fonctionner : tes applis gardent le droit d'envoyer tes
            écoutes.
          </p>
        </div>
        <Button
          tone="outline"
          onClick={signOut}
          disabled={leaving}
          className={css({ alignSelf: "flex-start", gap: "8px", fontSize: "14px" })}
        >
          <SignOutIcon />
          Se déconnecter
        </Button>
      </div>
    </>
  );
}
