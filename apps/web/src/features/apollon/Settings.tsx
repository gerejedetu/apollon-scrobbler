import { useRouter } from "@tanstack/react-router";
import { type ChangeEvent, type DragEvent, type FormEvent, useRef, useState } from "react";
import { api, type ApiKey, type InstanceSettings, type Me } from "../../api/index.ts";
import { forgetViewer } from "../../auth/index.ts";
import { formatCount, formatDate } from "../../lib/format/index.ts";
import { intlLocale } from "../../lib/locale.ts";
import { applyTheme, initialTheme, type ThemePref } from "../../lib/theme.ts";
import { getLocale, type Locale, setLocale } from "../../paraglide/runtime.js";
import {
  ApiKeyList,
  AppearancePicker,
  Button,
  ExportPanel,
  ImportPanel,
  LangSelect,
  Page,
  SettingsLayout,
  type SettingsSection,
  TextField,
  Toggle,
} from "../../ui/apollon/index.ts";
import { useToast } from "../../ui/feedback/index.ts";
import {
  batches,
  NotALastFmExport,
  type ParsedExport,
  parseLastFmExport,
} from "../import/lastfm.ts";
import { m } from "../../paraglide/messages.js";

/** Each section's address under /reglages. */
export const SECTION_PATHS: Record<SettingsSection, string> = {
  profile: "profil",
  appearance: "apparence",
  keys: "cles",
  import: "import",
  instance: "instance",
};
export const sectionHref = (s: SettingsSection) => `/reglages/${SECTION_PATHS[s]}`;

/** The settings frame (design system: SettingsLayout): sections on the left, one on the right. */
export function SettingsFrame({
  me,
  active,
  lead,
  children,
}: {
  me: Me;
  active: SettingsSection;
  lead?: string;
  children: React.ReactNode;
}) {
  return (
    <Page>
      <SettingsLayout active={active} owner={me.owner === true} lead={lead} hrefFor={sectionHref}>
        {children}
      </SettingsLayout>
    </Page>
  );
}

/** Saves a profile change and says so. */
function useSaveMe() {
  const router = useRouter();
  const toast = useToast();
  return async (patch: { private?: boolean; accent?: string | null }) => {
    try {
      await api.me.update(patch);
      forgetViewer();
      await router.invalidate();
      toast(m.ds_settings_saved());
      return true;
    } catch {
      toast(m.setting_failed(), "error");
      return false;
    }
  };
}

/** Profil: the name, who can see the profile, the language. */
export function ProfileSection({ me }: { me: Me }) {
  const save = useSaveMe();
  const [isPrivate, setPrivate] = useState(me.private);
  return (
    <SettingsFrame me={me} active="profile" lead={m.ds_settings_profile_lead()}>
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
        onChange={async (e: { target: { checked: boolean } }) => {
          const next = e.target.checked;
          setPrivate(next);
          if (!(await save({ private: next }))) setPrivate(!next);
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
    </SettingsFrame>
  );
}

/** The design system's theme names: "system" is our "auto". */
const toPicker = (t: ThemePref) => (t === "auto" ? "system" : t);
const fromPicker = (t: string): ThemePref => (t === "system" ? "auto" : (t as ThemePref));
const GOLD = "#f2b62b";

/** Apparence: the theme (the viewer's) and the profile colour (what visitors see). */
export function AppearanceSection({ me }: { me: Me }) {
  const save = useSaveMe();
  const [theme, setTheme] = useState<ThemePref>(initialTheme);
  const [accent, setAccent] = useState(me.accent ?? GOLD);
  return (
    <SettingsFrame me={me} active="appearance" lead={m.ds_settings_appearance_lead()}>
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
          void save({ accent: hex.toLowerCase() === GOLD ? null : hex });
        }}
      />
    </SettingsFrame>
  );
}

/** Clés d'API: one per player; the full key is shown once. */
export function KeysSection({ me, keys }: { me: Me; keys: ApiKey[] }) {
  const router = useRouter();
  const toast = useToast();
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState("");
  const [revealed, setRevealed] = useState<{ name: string; key: string } | null>(null);

  async function create(e: FormEvent) {
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
      toast(m.setting_failed(), "error");
    }
  }

  return (
    <SettingsFrame me={me} active="keys" lead={m.token_paste_help()}>
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
        <form className="ap-keys__new" onSubmit={(e) => void create(e)}>
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
    </SettingsFrame>
  );
}

type ImportState =
  | { state: "idle" }
  | { state: "ready"; file: File; parsed: ParsedExport }
  | { state: "importing"; file: File; parsed: ParsedExport; sent: number }
  | { state: "done"; file: File; parsed: ParsedExport; added: number; sent: number }
  | { state: "error"; file?: File; parsed?: ParsedExport; message: string };

const sizeLabel = (bytes: number) =>
  bytes >= 1_000_000
    ? `${(bytes / 1_000_000).toLocaleString(intlLocale(), { maximumFractionDigits: 1 })} ${m.unit_mb()}`
    : `${Math.max(1, Math.round(bytes / 1000))} ${m.unit_kb()}`;

/** Importer et exporter: a Last.fm export read here and sent in batches, then the JSON export. */
export function ImportSection({ me }: { me: Me }) {
  const router = useRouter();
  const toast = useToast();
  const [st, setSt] = useState<ImportState>({ state: "idle" });
  const [exporting, setExporting] = useState(false);
  const cancelled = useRef(false);

  async function read(file: File) {
    try {
      const parsed = parseLastFmExport(await file.text());
      if (parsed.listens.length === 0) setSt({ state: "error", file, message: m.import_nothing() });
      else setSt({ state: "ready", file, parsed });
    } catch (e) {
      setSt({
        state: "error",
        file,
        message: e instanceof NotALastFmExport ? m.import_not_lastfm() : m.import_unreadable(),
      });
    }
  }

  async function start() {
    if (st.state !== "ready") return;
    const { file, parsed } = st;
    cancelled.current = false;
    let sent = 0;
    let added = 0;
    setSt({ state: "importing", file, parsed, sent });
    try {
      for (const batch of batches(parsed.listens)) {
        if (cancelled.current) break;
        const res = await api.listens.submit(batch);
        sent += batch.length;
        added += res.inserted;
        setSt({ state: "importing", file, parsed, sent });
      }
      setSt({ state: "done", file, parsed, added, sent });
      forgetViewer();
      await router.invalidate();
    } catch (e) {
      setSt({
        state: "error",
        file,
        parsed,
        message: m.import_interrupted({
          count: formatCount(sent),
          reason: e instanceof Error ? e.message : m.unknown_error(),
        }),
      });
    }
  }

  /** Every listen, page by page, as a ListenBrainz-style JSON file. */
  async function exportAll() {
    setExporting(true);
    try {
      const all: unknown[] = [];
      let before: number | undefined;
      for (;;) {
        const page = await api.listens.list(me.userName, { before, limit: 1000 });
        for (const l of page.listens)
          all.push({
            listened_at: l.listenedAt,
            track_metadata: {
              artist_name: l.artist,
              track_name: l.track,
              release_name: l.album ?? undefined,
              additional_info: {
                ...l.extra,
                duration_ms: l.durationMs ?? undefined,
                recording_mbid: l.mbids?.recording ?? undefined,
                release_mbid: l.mbids?.release ?? undefined,
              },
            },
          });
        const last = page.listens.at(-1);
        if (!last || page.listens.length < 1000) break;
        before = last.listenedAt;
      }
      const blob = new Blob([JSON.stringify(all)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `apollon-${me.userName}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast(m.setting_failed(), "error");
    } finally {
      setExporting(false);
    }
  }

  const file =
    "file" in st && st.file
      ? {
          name: st.file.name,
          size: sizeLabel(st.file.size),
          listens: "parsed" in st && st.parsed ? st.parsed.listens.length : undefined,
          from: "parsed" in st && st.parsed ? (st.parsed.from ?? undefined) : undefined,
          to: "parsed" in st && st.parsed ? (st.parsed.to ?? undefined) : undefined,
        }
      : undefined;
  const total = "parsed" in st && st.parsed ? st.parsed.listens.length : 0;

  return (
    <SettingsFrame me={me} active="import" lead={m.import_intro()}>
      <ImportPanel
        sources={["lastfm"]}
        accept=".csv"
        state={st.state}
        file={file}
        error={st.state === "error" ? st.message : undefined}
        progress={
          st.state === "importing"
            ? { sent: st.sent, total }
            : st.state === "done"
              ? { sent: st.sent, total, added: st.added, duplicates: st.sent - st.added }
              : undefined
        }
        doneHref={`/u/${encodeURIComponent(me.userName)}/rapports`}
        onFile={(e: ChangeEvent<HTMLInputElement>) => {
          const f = e.target.files?.[0];
          if (f) void read(f);
        }}
        onDrop={(e: DragEvent<HTMLElement>) => {
          e.preventDefault();
          const f = e.dataTransfer.files[0];
          if (f) void read(f);
        }}
        onStart={() => void start()}
        onClear={() => setSt({ state: "idle" })}
        onCancel={() => {
          cancelled.current = true;
        }}
      />
      <ExportPanel
        listenCount={me.listenCount}
        busy={exporting}
        onExport={() => void exportAll()}
      />
    </SettingsFrame>
  );
}

/** Instance (owner only): who may create an account. */
export function InstanceSection({ me, instance }: { me: Me; instance: InstanceSettings }) {
  const toast = useToast();
  const [open, setOpen] = useState(instance.signupOpen);
  return (
    <SettingsFrame me={me} active="instance">
      <Toggle
        label={m.ds_signup_open()}
        description={m.ds_signup_open_help()}
        checked={open}
        onChange={async (e: { target: { checked: boolean } }) => {
          const next = e.target.checked;
          setOpen(next);
          try {
            await api.instance.update({ signupOpen: next });
            toast(m.ds_settings_saved());
          } catch {
            setOpen(!next);
            toast(m.setting_failed(), "error");
          }
        }}
      />
    </SettingsFrame>
  );
}
