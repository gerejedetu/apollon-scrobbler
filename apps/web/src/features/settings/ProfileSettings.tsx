import { useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { css } from "styled-system/css";
import { api, type Me } from "../../api/index.ts";
import { forgetViewer } from "../../auth/index.ts";
import { formatCount, formatDate } from "../../lib/format/index.ts";
import { CheckIcon } from "../../ui/icons.tsx";
import { Notice } from "../../ui/primitives/index.ts";
import { SwitchCard } from "../../ui/zag/index.ts";
import { settingsTitle } from "./SettingsLayout.tsx";
import { SignOut } from "./SignOut.tsx";

const row = css({
  display: "flex",
  justifyContent: "space-between",
  gap: "16px",
  py: "14px",
  borderTop: "1px solid token(colors.rule)",
  fontSize: "13px",
});

type SaveState = "idle" | "saving" | "saved" | "failed";

/** "Profil": who you are, the private-profile switch (PATCH /v1/me) and sign-out. */
export function ProfileSettings({ me }: { me: Me }) {
  const router = useRouter();
  const [isPrivate, setPrivate] = useState(me.private);
  const [state, setState] = useState<SaveState>("idle");

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

  return (
    <>
      <h1 className={settingsTitle}>Profil</h1>
      <section className={css({ display: "flex", flexDirection: "column" })}>
        <div className={row}>
          <span className={css({ color: "muted" })}>Nom d'utilisateur</span>
          <span className={css({ fontWeight: "500" })}>{me.userName}</span>
        </div>
        <div className={row}>
          <span className={css({ color: "muted" })}>Membre depuis</span>
          <span className={css({ fontWeight: "500" })}>{formatDate(me.createdAt)}</span>
        </div>
        <div className={row} style={{ borderBottom: "1px solid var(--colors-rule)" }}>
          <span className={css({ color: "muted" })}>Écoutes enregistrées</span>
          <span className={css({ fontWeight: "500" })}>{formatCount(me.listenCount)}</span>
        </div>
      </section>

      <section className={css({ display: "flex", flexDirection: "column", gap: "14px" })}>
        <h2 className={css({ m: 0, textStyle: "block" })}>Confidentialité</h2>
        <SwitchCard
          label="Profil privé"
          description="Tes écoutes et tes stats ne sont visibles que par toi, une fois connecté. Désactivé, n'importe qui avec l'adresse de ton profil peut les voir."
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
      </section>

      <SignOut />
    </>
  );
}
