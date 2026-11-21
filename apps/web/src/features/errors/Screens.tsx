import { Link, type ErrorComponentProps } from "@tanstack/react-router";
import { css } from "styled-system/css";
import { isNotFound } from "../../api/index.ts";
import { BareHeader, Main, Page } from "../../ui/layout/index.ts";
import { button } from "../../ui/primitives/index.ts";
import { isStaleBuildError, reloadForNewBuild } from "../../lib/stale-build.ts";
import { PreferencesMenu } from "../navigation/index.ts";
import { m } from "../../paraglide/messages.js";

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
        {m.hidden_title()}
      </h1>
      <p className={css({ m: 0, fontSize: "14px", lineHeight: "22px", color: "muted" })}>
        {signedIn ? m.hidden_text() : m.hidden_text_signed_out()}
      </p>
      <Link
        to={signedIn ? "/" : "/connexion"}
        className={button({ tone: "primary" })}
        style={{ marginTop: 8, paddingInline: 18 }}
      >
        {signedIn ? m.back_home() : m.signin_submit()}
      </Link>
    </Main>
  );
}

/** Inside a page that already has its header (nested routes). */
export function NotFound() {
  return (
    <Main narrow gap={16} padding="56px 24px 80px">
      <h1 className={title}>{m.notfound_title()}</h1>
      <p className={text}>
        {m.notfound_text()} <Link to="/">{m.back_home()}</Link>
      </p>
    </Main>
  );
}

export function RouteError({ error, reset }: ErrorComponentProps) {
  if (isNotFound(error)) return <NotFound />;
  // A tab older than the last deploy: reload into the new build instead of showing an error.
  if (typeof window !== "undefined" && isStaleBuildError(error) && reloadForNewBuild()) return null;
  return (
    <Main narrow gap={16} padding="56px 24px 80px">
      <h1 className={title}>{m.error_title()}</h1>
      <p className={text}>{error instanceof Error ? error.message : m.error_unknown()}</p>
      <p className={text}>
        <button type="button" onClick={reset} className={button({ tone: "outline", size: "sm" })}>
          {m.retry()}
        </button>
      </p>
    </Main>
  );
}

/** At the root, where no layout drew a header yet. */
export function RootNotFound() {
  return (
    <Page header={<BareHeader left={<PreferencesMenu />} />}>
      <NotFound />
    </Page>
  );
}

export function RootError(props: ErrorComponentProps) {
  return (
    <Page header={<BareHeader left={<PreferencesMenu />} />}>
      <RouteError {...props} />
    </Page>
  );
}
