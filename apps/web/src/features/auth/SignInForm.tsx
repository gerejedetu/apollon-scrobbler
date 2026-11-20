import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import { css } from "styled-system/css";
import { authClient, describeAuthError, forgetViewer, safeRedirect } from "../../auth/index.ts";
import { Button, Field, Notice } from "../../ui/primitives/index.ts";
import { formText } from "./form.ts";
import { authFoot, authForm, authTitle } from "./layout.tsx";

/** "Connexion à Needle": e-mail and password, then back where the visitor was going. */
export function SignInForm({ created, redirectTo }: { created?: boolean; redirectTo?: string }) {
  const router = useRouter();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    const { data: session, error } = await authClient.signIn.email({
      email: formText(data, "email"),
      password: formText(data, "password"),
    });
    setPending(false);
    if (error || !session) {
      setError(describeAuthError(error).message);
      return;
    }
    forgetViewer();
    await router.invalidate();
    const target = safeRedirect(redirectTo);
    if (target) router.history.push(target);
    else await navigate({ to: "/" });
  }

  return (
    <>
      <h1 className={authTitle} style={{ marginBottom: 8 }}>
        Connexion à Needle
      </h1>
      {created && !error ? (
        <Notice tone="success">Ton compte est créé. Connecte-toi pour continuer.</Notice>
      ) : null}
      {error ? <Notice tone="error">{error}</Notice> : null}
      <form className={authForm} onSubmit={onSubmit}>
        <Field
          label="E-mail"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="Ton adresse e-mail"
          required
        />
        <Field
          label="Mot de passe"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Ton mot de passe"
          required
        />
        <Button type="submit" className={css({ mt: "8px" })} disabled={pending}>
          {pending ? "Connexion…" : "Se connecter"}
        </Button>
      </form>
      <p className={authFoot}>
        Pas encore de compte ? <Link to="/inscription">Créer un compte</Link>
      </p>
    </>
  );
}
