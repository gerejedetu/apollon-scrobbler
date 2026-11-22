import type { ReactNode } from "react";
import { css, cx } from "styled-system/css";
import { BareHeader, Main, Page } from "../../ui/layout/index.ts";
import { pageTitle } from "../../ui/primitives/index.ts";
import { PreferencesMenu } from "../navigation/index.ts";

export const authTitle = cx(pageTitle, css({ textAlign: "center" }));
export const authForm = css({ display: "flex", flexDirection: "column", gap: "16px" });
export const authFoot = css({ m: 0, textAlign: "center", fontSize: "12px", color: "muted" });

/** The narrow centred column of the account screens. */
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <Page header={<BareHeader left={<PreferencesMenu />} />}>
      <Main narrow gap={20} padding="56px 24px 80px">
        {children}
      </Main>
    </Page>
  );
}
