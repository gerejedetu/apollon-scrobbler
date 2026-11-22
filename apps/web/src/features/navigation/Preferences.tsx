import { useState } from "react";
import { css } from "styled-system/css";
import { applyTheme, initialTheme, type ThemePref } from "../../lib/theme.ts";
import { getLocale, type Locale, setLocale } from "../../paraglide/runtime.js";
import { GlobeIcon } from "../../ui/icons.tsx";
import { capsLabel } from "../../ui/primitives/index.ts";
import { Popover, SegmentedControl } from "../../ui/zag/index.ts";
import { m } from "../../paraglide/messages.js";

const group = css({ display: "flex", flexDirection: "column", gap: "8px" });

const THEMES: { value: ThemePref; label: () => string }[] = [
  { value: "light", label: m.theme_light },
  { value: "dark", label: m.theme_dark },
  { value: "auto", label: m.theme_auto },
];

const LOCALES: { value: Locale; label: string }[] = [
  { value: "fr", label: "Français" },
  { value: "en", label: "English" },
];

/** Theme and language pickers, shared by the account menu and the signed-out preferences. */
export function PreferenceControls({ groupClassName = group }: { groupClassName?: string }) {
  const [theme, setTheme] = useState<ThemePref>(initialTheme);
  return (
    <>
      <div className={groupClassName}>
        <span className={capsLabel}>{m.theme_caps()}</span>
        <SegmentedControl<ThemePref>
          label={m.theme()}
          value={theme}
          options={THEMES.map((o) => ({ value: o.value, label: o.label() }))}
          onValueChange={(v) => {
            setTheme(v);
            applyTheme(v);
          }}
        />
      </div>
      <div className={groupClassName}>
        <span className={capsLabel}>{m.language_caps()}</span>
        <SegmentedControl<Locale>
          label={m.language()}
          value={getLocale()}
          options={LOCALES}
          // Paraglide stores the choice in a cookie and reloads the page in that language.
          onValueChange={(locale) => void setLocale(locale)}
        />
      </div>
    </>
  );
}

const trigger = css({
  height: "32px",
  px: "8px",
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  border: 0,
  borderRadius: "pill",
  bg: "transparent",
  color: "ink",
  fontSize: "12px",
  fontWeight: "500",
  letterSpacing: "0.04em",
  cursor: "pointer",
  _hover: { bg: "chip" },
  "&[data-state=open]": { bg: "chip" },
  "&:focus-visible": { outline: "2px solid token(colors.violet)", outlineOffset: "1px" },
});

/** Signed out there is no account menu: a globe opens the same theme and language pickers. */
export function PreferencesMenu() {
  return (
    <Popover
      label={m.preferences()}
      placement="bottom-start"
      triggerClassName={trigger}
      trigger={
        <>
          <GlobeIcon />
          <span aria-hidden="true">{getLocale().toUpperCase()}</span>
          <span className={css({ srOnly: true })}>{m.preferences()}</span>
        </>
      }
    >
      {() => (
        <div
          className={css({ width: "232px", display: "flex", flexDirection: "column", gap: "14px" })}
        >
          <PreferenceControls />
        </div>
      )}
    </Popover>
  );
}
