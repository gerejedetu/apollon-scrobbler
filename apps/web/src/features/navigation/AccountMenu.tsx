import * as menu from "@zag-js/menu";
import { normalizeProps, Portal, useMachine } from "@zag-js/react";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { useId, useState } from "react";
import { css } from "styled-system/css";
import { authClient, forgetViewer } from "../../auth/index.ts";
import { applyTheme, initialTheme, type ThemePref } from "../../lib/theme.ts";
import { DownloadIcon, KeyIcon, SignOutIcon, UserIcon } from "../../ui/icons.tsx";
import { capsLabel } from "../../ui/primitives/index.ts";
import { SegmentedControl } from "../../ui/zag/index.ts";

const avatar = css({
  width: "28px",
  height: "28px",
  p: 0,
  border: 0,
  borderRadius: "14px",
  bg: "avatar",
  cursor: "pointer",
  "&[data-state=open]": {
    boxShadow: "0 0 0 2px token(colors.page), 0 0 0 4px token(colors.violet)",
  },
  "&:focus-visible": {
    boxShadow: "0 0 0 2px token(colors.page), 0 0 0 4px token(colors.violet)",
    outline: "none",
  },
});
const content = css({
  width: "260px",
  p: "6px",
  boxSizing: "border-box",
  bg: "raised",
  border: "1px solid token(colors.rule)",
  borderRadius: "card",
  boxShadow: "0 12px 32px token(colors.shadow)",
  display: "flex",
  flexDirection: "column",
  outline: "none",
  zIndex: 30,
});
const item = css({
  display: "flex",
  alignItems: "center",
  gap: "10px",
  height: "36px",
  px: "10px",
  borderRadius: "field",
  fontSize: "13px",
  color: "ink",
  cursor: "pointer",
  "& svg": { color: "muted" },
  "&[data-highlighted]": { bg: "field" },
});
const separator = css({ height: "1px", mx: "4px", my: "6px", bg: "rule" });
const group = css({
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  px: "10px",
  pt: "6px",
  pb: "8px",
});

const THEMES: { value: ThemePref; label: string }[] = [
  { value: "light", label: "Clair" },
  { value: "dark", label: "Sombre" },
  { value: "auto", label: "Auto" },
];

/** The avatar's dropdown: profile, settings pages, theme, sign-out (board "Profil", account menu). */
export function AccountMenu({ userName }: { userName: string }) {
  const navigate = useNavigate();
  const router = useRouter();
  const [theme, setTheme] = useState<ThemePref>(initialTheme);
  const service = useMachine(menu.machine, {
    id: useId(),
    positioning: { placement: "bottom-end", gutter: 10 },
    onSelect: async ({ value }) => {
      if (value === "profile") await navigate({ to: "/u/$userName", params: { userName } });
      if (value === "settings") await navigate({ to: "/reglages" });
      if (value === "tokens") await navigate({ to: "/reglages/tokens" });
      if (value === "import") await navigate({ to: "/reglages/import" });
      if (value === "signout") {
        await authClient.signOut();
        forgetViewer();
        await navigate({ to: "/connexion" });
        await router.invalidate();
      }
    },
  });
  const api = menu.connect(service, normalizeProps);
  return (
    <>
      <button {...api.getTriggerProps()} aria-label="Mon compte" className={avatar} />
      <Portal>
        <div {...api.getPositionerProps()}>
          <div {...api.getContentProps()} aria-label="Mon compte" className={content}>
            <div
              {...api.getItemProps({ value: "profile" })}
              className={css({
                display: "flex",
                alignItems: "center",
                gap: "10px",
                px: "10px",
                pt: "8px",
                pb: "12px",
                cursor: "pointer",
                color: "ink",
                borderRadius: "field",
                "&[data-highlighted]": { bg: "field" },
              })}
            >
              <span
                className={css({
                  width: "36px",
                  height: "36px",
                  flexShrink: 0,
                  borderRadius: "18px",
                  bg: "avatar",
                })}
              />
              <span
                className={css({
                  display: "flex",
                  flexDirection: "column",
                  gap: "2px",
                  minWidth: 0,
                })}
              >
                <span className={css({ fontSize: "13px", fontWeight: "600" })}>{userName}</span>
                <span className={css({ fontSize: "12px", color: "muted" })}>Voir mon profil</span>
              </span>
            </div>
            <div {...api.getSeparatorProps()} className={separator} style={{ marginTop: 0 }} />
            <div {...api.getItemProps({ value: "settings" })} className={item}>
              <UserIcon />
              Réglages du profil
            </div>
            <div {...api.getItemProps({ value: "tokens" })} className={item}>
              <KeyIcon />
              Tokens d'API
            </div>
            <div {...api.getItemProps({ value: "import" })} className={item}>
              <DownloadIcon />
              Importer
            </div>
            <div {...api.getSeparatorProps()} className={separator} />
            <div className={group}>
              <span className={capsLabel}>THÈME</span>
              <SegmentedControl<ThemePref>
                label="Thème"
                value={theme}
                options={THEMES}
                onValueChange={(v) => {
                  setTheme(v);
                  applyTheme(v);
                }}
              />
            </div>
            <div {...api.getSeparatorProps()} className={separator} />
            <div {...api.getItemProps({ value: "signout" })} className={item}>
              <SignOutIcon size={16} />
              Se déconnecter
            </div>
          </div>
        </div>
      </Portal>
    </>
  );
}
