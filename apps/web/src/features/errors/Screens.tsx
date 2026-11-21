import { Link, type ErrorComponentProps } from "@tanstack/react-router";
import { css } from "styled-system/css";
import { isNotFound } from "../../api/index.ts";
import { BareHeader, Main, Page } from "../../ui/layout/index.ts";
import { button } from "../../ui/primitives/index.ts";

const title = css({ m: 0, textStyle: "pageTitle", fontSize: "34px", textAlign: "center" });
const text = css({ m: 0, textAlign: "center", fontSize: "13px", color: "muted" });

/** A profile that is private or does not exist (board "Profil privé ou introuvable"): both look the same. */
export function HiddenProfile({ signedIn }: { signedIn: boolean }) {
  return (
    <Main
      narrow
      gap={16}
      padding="120px 24px"
      className={css({ alignItems: "center", textAlign: "center" })}
    >
      <span
        className={css({
          width: "56px",
          height: "56px",
          borderRadius: "28px",
          bg: "field",
          color: "muted",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        })}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="5" y="11" width="14" height="9" rx="2" />
          <path d="M8 11V8a4 4 0 0 1 8 0v3" />
        </svg>
      </span>
      <h1 className={css({ m: 0, textStyle: "wide", fontSize: "28px", lineHeight: 1.15 })}>
        Ce profil n'est pas visible
      </h1>
      <p className={css({ m: 0, fontSize: "14px", lineHeight: "22px", color: "muted" })}>
        {signedIn
          ? "Il est privé ou il n'existe pas."
          : "Il est privé ou il n'existe pas. Si c'est le tien, connecte-toi pour le voir."}
      </p>
      <Link
        to={signedIn ? "/" : "/connexion"}
        className={button({ tone: "primary" })}
        style={{ marginTop: 8, paddingInline: 18 }}
      >
        {signedIn ? "Revenir à l'accueil" : "Se connecter"}
      </Link>
    </Main>
  );
}

/** Inside a page that already has its header (nested routes). */
export function NotFound() {
  return (
    <Main narrow gap={16} padding="56px 24px 80px">
      <h1 className={title}>Rien ici</h1>
      <p className={text}>
        Cette page n'existe pas, ou ce profil est privé. <Link to="/">Revenir à l'accueil</Link>
      </p>
    </Main>
  );
}

export function RouteError({ error, reset }: ErrorComponentProps) {
  if (isNotFound(error)) return <NotFound />;
  return (
    <Main narrow gap={16} padding="56px 24px 80px">
      <h1 className={title}>Ça n'a pas marché</h1>
      <p className={text}>{error instanceof Error ? error.message : "Erreur inconnue."}</p>
      <p className={text}>
        <button
          type="button"
          onClick={reset}
          className={css({ border: 0, bg: "transparent", color: "violet", fontSize: "13px" })}
        >
          Réessayer
        </button>
      </p>
    </Main>
  );
}

/** At the root, where no layout drew a header yet. */
export function RootNotFound() {
  return (
    <Page header={<BareHeader />}>
      <NotFound />
    </Page>
  );
}

export function RootError(props: ErrorComponentProps) {
  return (
    <Page header={<BareHeader />}>
      <RouteError {...props} />
    </Page>
  );
}
