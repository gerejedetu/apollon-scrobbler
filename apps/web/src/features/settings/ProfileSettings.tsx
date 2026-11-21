import { useNavigate, useRouter } from "@tanstack/react-router";
import { type ReactNode, useEffect, useState } from "react";
import { css } from "styled-system/css";
import { api, type Me } from "../../api/index.ts";
import { authClient, forgetViewer } from "../../auth/index.ts";
import { formatCount } from "../../lib/format/index.ts";
import { CheckIcon, SignOutIcon } from "../../ui/icons.tsx";
import { Button, Notice } from "../../ui/primitives/index.ts";
import { Switch } from "../../ui/zag/index.ts";
import { settingsTitle } from "./SettingsLayout.tsx";
import { dateFormat } from "../../lib/locale.ts";
import { profilePrefix } from "../../lib/origin.ts";
import { m } from "../../paraglide/messages.js";

const group = css({ display: "flex", flexDirection: "column", gap: "8px" });
const fieldLabel = css({ fontSize: "13px", fontWeight: "500" });
const help = css({ m: 0, fontSize: "12px", lineHeight: "18px", color: "muted" });

function ReadOnly({ children }: { children: ReactNode }) {
  return (
    <div
      aria-readonly="true"
      className={css({
        height: "40px",
        px: "12px",
        display: "flex",
        alignItems: "center",
        borderRadius: "button",
        bg: "field",
        fontSize: "13px",
        color: "placeholder",
      })}
    >
      {children}
    </div>
  );
}

type SaveState = "idle" | "saving" | "saved" | "failed";

/** Owner only: whether new people may create an account on this instance (PATCH /v1/instance). */
function SignupSetting() {
  const [open, setOpen] = useState<boolean | null>(null);
  const [state, setState] = useState<SaveState>("idle");
  useEffect(() => {
    api.instance
      .get()
      .then((i) => setOpen(i.signupOpen))
      .catch(() => setState("failed"));
  }, []);

  async function toggle(next: boolean) {
    setOpen(next);
    setState("saving");
    try {
      setOpen((await api.instance.update({ signupOpen: next })).signupOpen);
      setState("saved");
    } catch {
      setOpen(!next);
      setState("failed");
    }
  }

  return (
    <div className={css({ display: "flex", flexDirection: "column", gap: "12px" })}>
      <div className={css({ display: "flex", flexDirection: "column", gap: "4px" })}>
        <span className={fieldLabel}>{m.signup_setting_title()}</span>
        <p className={help}>{m.signup_setting_help()}</p>
      </div>
      <Switch
        label={m.signup_allow()}
        checked={open ?? false}
        disabled={open === null || state === "saving"}
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
          {m.saved()}
        </span>
      ) : null}
      {state === "failed" ? <Notice tone="error">{m.setting_failed()}</Notice> : null}
    </div>
  );
}

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
      <h1 className={settingsTitle}>{m.tab_profile()}</h1>
      <div className={group}>
        <span className={fieldLabel}>{m.field_username()}</span>
        <ReadOnly>{me.userName}</ReadOnly>
        <p className={help}>
          {m.username_help()} {profilePrefix()}
          <b className={css({ color: "ink", fontWeight: "500" })}>{me.userName}</b>
        </p>
      </div>
      <div className={group}>
        <span className={fieldLabel}>{m.member_since_label()}</span>
        <ReadOnly>
          {dateFormat({ day: "numeric", month: "long", year: "numeric" }).format(
            new Date(me.createdAt * 1000),
          )}{" "}
          · {m.count_listens({ count: formatCount(me.listenCount) })}
        </ReadOnly>
      </div>
      <div className={css({ display: "flex", flexDirection: "column", gap: "12px" })}>
        <div className={css({ display: "flex", flexDirection: "column", gap: "4px" })}>
          <span className={fieldLabel}>{m.profile_visibility()}</span>
          <p className={help}>{m.private_help()}</p>
        </div>
        <Switch
          label={m.private_profile()}
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
            {m.saved()}
          </span>
        ) : null}
        {state === "failed" ? <Notice tone="error">{m.setting_failed()}</Notice> : null}
      </div>
      {me.owner ? <SignupSetting /> : null}
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
          <span className={fieldLabel}>{m.signout()}</span>
          <p className={help}>{m.signout_help()}</p>
        </div>
        <Button
          tone="outline"
          onClick={signOut}
          disabled={leaving}
          className={css({ alignSelf: "flex-start" })}
        >
          <SignOutIcon />
          {m.signout()}
        </Button>
      </div>
    </>
  );
}
