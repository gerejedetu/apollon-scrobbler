import { Link, type ErrorComponentProps } from "@tanstack/react-router";
import { css } from "styled-system/css";
import { isNotFound } from "../../api/index.ts";
import { BareHeader, Main, Page } from "../../ui/layout/index.ts";

const title = css({ m: 0, textStyle: "pageTitle", fontSize: "34px", textAlign: "center" });
const text = css({ m: 0, textAlign: "center", fontSize: "13px", color: "muted" });

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
