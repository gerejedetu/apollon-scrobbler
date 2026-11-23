import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import { api, type ApiKey, type Instance, type Me } from "../../api/index.ts";
import { authClient, forgetViewer } from "../../auth/index.ts";
import { formatCount, formatDate } from "../../lib/format/index.ts";
import { applyTheme, initialTheme, type ThemePref } from "../../lib/theme.ts";
import { getLocale, type Locale, setLocale } from "../../paraglide/runtime.js";
import {
  ApiKeyList,
  AppearancePicker,
  Button,
  LangSelect,
  Page,
  SectionHeader,
  TextField,
  Toggle,
} from "../../ui/apollon/index.ts";
import { useToast } from "../../ui/feedback/index.ts";
import { m } from "../../paraglide/messages.js";

/** The design system's theme names: "system" is our "auto". */
const toPicker = (t: ThemePref) => (t === "auto" ? "system" : t);
const fromPicker = (t: string): ThemePref => (t === "system" ? "auto" : (t as ThemePref));

/**
 * Settings (design system: PageSettings), one page: profile, appearance, API keys, instance (owner), import,
 * sign-out. Each change saves at once and says so with a notice.
 */
export function SettingsPage({
  me,
  keys,
  instance,
}: {
  me: Me;
  keys: ApiKey[];
  instance: Instance | null;
}) {
  const router = useRouter();
  const navigate = useNavigate();
  const toast = useToast();
  const [isPrivate, setPrivate] = useState(me.private);
  const [accent, setAccent] = useState(me.accent ?? "#f2b62b");
  const [theme, setTheme] = useState<ThemePref>(initialTheme);
  const [signupOpen, setSignupOpen] = useState(instance?.signupOpen ?? false);
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState("");
  const [revealed, setRevealed] = useState<{ name: string; key: string } | null>(null);

  const saved = () => toast(m.ds_settings_saved());
  const failed = () => toast(m.setting_failed(), "error");

  async function patchMe(patch: { private?: boolean; accent?: string | null }) {
    try {
      await api.me.update(patch);
      forgetViewer();
      await router.invalidate();
      saved();
    } catch {
      failed();
    }
  }

  async function createKey(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      const key = await api.tokens.create(trimmed);
      setRevealed({ name: key.name ?? trimmed, key: key.key });
      setNaming(false);
      setName("");
      await router.invalidate();
    } catch {
      toast(m.token_create_failed(), "error");
    }
  }

  async function revoke(id: string) {
    try {
      await api.tokens.delete(id);
      setRevealed(null);
      await router.invalidate();
      toast(m.ds_key_revoked());
    } catch {
      failed();
    }
  }

  async function signOut() {
    await authClient.signOut();
    forgetViewer();
    await navigate({ to: "/connexion" });
    await router.invalidate();
  }

  return (
    <Page>
      <div className="ap-settings">
        <h1 className="ap-pagetitle">{m.nav_settings()}</h1>
        <div className="ap-stack ap-stack--sm">
          <SectionHeader title={m.tab_profile()} size="sm" showPeriod={false} />
          <TextField
            label={m.field_username()}
            value={me.userName}
            readOnly
            hint={m.ds_member_since({
              date: formatDate(me.createdAt),
              count: formatCount(me.listenCount),
            })}
          />
          <Toggle
            label={m.private_profile()}
            description={m.private_help()}
            checked={isPrivate}
            onChange={(e: { target: { checked: boolean } }) => {
              setPrivate(e.target.checked);
              void patchMe({ private: e.target.checked });
            }}
          />
          <div className="ap-field">
            <span className="ap-field__label">{m.language()}</span>
            <div>
              <LangSelect
                tone="light"
                value={getLocale()}
                onChange={(l: Locale) => void setLocale(l)}
              />
            </div>
          </div>

          <div className="ap-rule" />
          <SectionHeader title={m.ds_appearance()} size="sm" showPeriod={false} />
          <AppearancePicker
            theme={toPicker(theme)}
            accent={accent}
            onTheme={(t: string) => {
              const pref = fromPicker(t);
              setTheme(pref);
              applyTheme(pref);
            }}
            onAccent={(hex: string) => {
              setAccent(hex);
              void patchMe({ accent: hex.toLowerCase() === "#f2b62b" ? null : hex });
            }}
          />

          <div className="ap-rule" />
          <div id="cles">
            <SectionHeader title={m.settings_tokens()} size="sm" showPeriod={false} />
          </div>
          <ApiKeyList
            keys={keys.map((k) => ({
              id: k.id,
              name: k.name ?? m.unnamed(),
              start: k.start ?? undefined,
              createdAt: Date.parse(k.createdAt) / 1000,
              lastUsedAt: k.lastRequest ? Date.parse(k.lastRequest) / 1000 : null,
            }))}
            revealed={revealed ?? undefined}
            onCreate={() => setNaming(true)}
            onRevoke={(k: { id: string }) => void revoke(k.id)}
            onCopy={() => {
              if (revealed)
                void navigator.clipboard?.writeText(revealed.key).then(() => toast(m.copied()));
            }}
          />
          {naming ? (
            <form className="ap-settings__newkey" onSubmit={(e) => void createKey(e)}>
              <TextField
                label={m.token_name()}
                placeholder={m.token_name_placeholder()}
                value={name}
                autoFocus
                onChange={(e: { target: { value: string } }) => setName(e.target.value)}
              />
              <Button variant="primary" type="submit" disabled={!name.trim()}>
                {m.token_create()}
              </Button>
            </form>
          ) : null}
          <p className="ap-settings__note">{m.token_paste_help()}</p>

          {instance && me.owner ? (
            <>
              <div className="ap-rule" />
              <SectionHeader title={m.ds_instance()} size="sm" showPeriod={false} />
              <Toggle
                label={m.ds_signup_open()}
                description={m.ds_signup_open_help()}
                checked={signupOpen}
                onChange={async (e: { target: { checked: boolean } }) => {
                  setSignupOpen(e.target.checked);
                  try {
                    await api.instance.update({ signupOpen: e.target.checked });
                    saved();
                  } catch {
                    setSignupOpen(!e.target.checked);
                    failed();
                  }
                }}
              />
            </>
          ) : null}

          <div className="ap-rule" />
          <SectionHeader title={m.settings_import()} size="sm" showPeriod={false} />
          <p className="ap-settings__note">
            {m.import_intro()}{" "}
            <Link to="/reglages/import" className="ap-link">
              {m.ds_import_open()}
            </Link>
          </p>

          <div className="ap-rule" />
          <div>
            <Button variant="secondary" onClick={() => void signOut()}>
              {m.signout()}
            </Button>
          </div>
        </div>
      </div>
    </Page>
  );
}
