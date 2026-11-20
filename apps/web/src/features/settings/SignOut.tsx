import { useNavigate, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { css } from "styled-system/css";
import { authClient, forgetViewer } from "../../auth/index.ts";
import { SignOutIcon } from "../../ui/icons.tsx";
import { Button } from "../../ui/primitives/index.ts";

/** Ends the browser session only: API tokens keep working. */
export function SignOut() {
  const router = useRouter();
  const navigate = useNavigate();
  const [pending, setPending] = useState(false);

  async function signOut() {
    setPending(true);
    await authClient.signOut();
    // Leave the guarded page first, so its guard does not bounce back with a redirect parameter.
    forgetViewer();
    await navigate({ to: "/connexion" });
    await router.invalidate();
  }

  return (
    <section
      className={css({
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "16px",
        pt: "24px",
        borderTop: "1px solid token(colors.rule)",
      })}
    >
      <span className={css({ display: "flex", flexDirection: "column", gap: "4px" })}>
        <span className={css({ fontSize: "14px", fontWeight: "500" })}>Se déconnecter</span>
        <span className={css({ fontSize: "12px", color: "muted" })}>
          Tes tokens d'API continuent de fonctionner : tes applis gardent le droit d'envoyer tes
          écoutes.
        </span>
      </span>
      <Button
        tone="outline"
        size="sm"
        onClick={signOut}
        disabled={pending}
        className={css({ gap: "8px" })}
      >
        <SignOutIcon />
        Se déconnecter
      </Button>
    </section>
  );
}
