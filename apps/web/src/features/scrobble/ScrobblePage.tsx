import { Link, useRouter } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import { css } from "styled-system/css";
import { api } from "../../api/index.ts";
import { forgetViewer } from "../../auth/index.ts";
import { CheckIcon } from "../../ui/icons.tsx";
import { Button, Field } from "../../ui/primitives/index.ts";
import { type FieldErrors, type ScrobbleForm, validateScrobble } from "./model.ts";
import { m } from "../../paraglide/messages.js";

const two = (n: number) => String(n).padStart(2, "0");
function nowLocal() {
  const d = new Date();
  return {
    date: `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())}`,
    time: `${two(d.getHours())}:${two(d.getMinutes())}`,
  };
}

const required = (
  <span className={css({ color: "danger" })} aria-hidden="true">
    {" "}
    *
  </span>
);
function Optional() {
  return <span className={css({ fontWeight: "400", color: "muted" })}> · {m.optional()}</span>;
}

const choice = css({
  flex: 1,
  display: "flex",
  alignItems: "center",
  gap: "10px",
  height: "40px",
  px: "12px",
  borderRadius: "button",
  border: "1px solid token(colors.dashed)",
  fontSize: "13px",
  fontWeight: "400",
  cursor: "pointer",
  "&:has(input:checked)": { borderColor: "ink", fontWeight: "500" },
  "& input": { m: 0, accentColor: "token(colors.violet)" },
});

type Outcome =
  | { kind: "added"; track: string }
  | { kind: "duplicate" }
  | { kind: "failed"; message: string }
  | null;

/** "Scrobbler une écoute": add by hand a listen no app sent (vinyl, radio, concert). POST /v1/listens. */
export function ScrobblePage({ userName }: { userName: string }) {
  const router = useRouter();
  const [form, setForm] = useState<ScrobbleForm>(() => ({
    artist: "",
    track: "",
    album: "",
    duration: "",
    when: "now",
    ...nowLocal(),
  }));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [outcome, setOutcome] = useState<Outcome>(null);
  const [pending, setPending] = useState(false);
  const set = (key: keyof ScrobbleForm) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = validateScrobble(form);
    if ("errors" in result) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    setPending(true);
    try {
      const res = await api.listens.submit([{ ...result.listen, extra: { origin: "manual" } }]);
      setOutcome(
        res.inserted > 0 ? { kind: "added", track: result.listen.track } : { kind: "duplicate" },
      );
      if (res.inserted > 0) {
        setForm((f) => ({ ...f, track: "", duration: "" }));
        forgetViewer();
        await router.invalidate();
      }
    } catch (e) {
      setOutcome({
        kind: "failed",
        message: e instanceof Error ? e.message : m.scrobble_failed(),
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <div className={css({ display: "flex", flexDirection: "column", gap: "8px" })}>
        <h1
          className={css({
            m: 0,
            textStyle: "wide",
            fontSize: "34px",
            letterSpacing: "-0.01em",
            lineHeight: 1.05,
          })}
        >
          {m.scrobble_title()}
        </h1>
        <p className={css({ m: 0, fontSize: "14px", lineHeight: "22px", color: "muted" })}>
          {m.scrobble_intro()}
        </p>
      </div>

      <form
        noValidate
        onSubmit={onSubmit}
        className={css({ display: "flex", flexDirection: "column", gap: "18px" })}
      >
        <Field
          label={
            <span>
              {m.field_artist()}
              {required}
            </span>
          }
          value={form.artist}
          onChange={set("artist")}
          required
          error={errors.artist}
        />
        <Field
          label={
            <span>
              {m.field_track()}
              {required}
            </span>
          }
          value={form.track}
          onChange={set("track")}
          required
          error={errors.track}
        />
        <Field
          label={
            <span>
              {m.field_album()}
              <Optional />
            </span>
          }
          placeholder={m.field_album_placeholder()}
          value={form.album}
          onChange={set("album")}
        />
        <div
          className={css({
            display: "grid",
            gridTemplateColumns: { base: "minmax(0, 1fr)", sm: "minmax(0, 1fr) 140px" },
            gap: "16px",
          })}
        >
          <fieldset
            className={css({
              m: 0,
              p: 0,
              border: 0,
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              minWidth: 0,
            })}
          >
            <legend className={css({ p: "0 0 8px", fontSize: "13px", fontWeight: "500" })}>
              {m.field_when()}
            </legend>
            <div className={css({ display: "flex", gap: "8px" })}>
              <label className={choice}>
                <input
                  type="radio"
                  name="when"
                  checked={form.when === "now"}
                  onChange={() => setForm((f) => ({ ...f, when: "now" }))}
                />
                {m.when_now()}
              </label>
              <label className={choice}>
                <input
                  type="radio"
                  name="when"
                  checked={form.when === "other"}
                  onChange={() => setForm((f) => ({ ...f, when: "other", ...nowLocal() }))}
                />
                {m.when_other()}
              </label>
            </div>
          </fieldset>
          <Field
            label={
              <span>
                {m.field_length()}
                <Optional />
              </span>
            }
            inputMode="numeric"
            placeholder="m:ss"
            value={form.duration}
            onChange={set("duration")}
            error={errors.duration}
          />
        </div>
        {form.when === "other" ? (
          <div
            className={css({
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
              gap: "16px",
            })}
          >
            <Field
              label={m.field_date()}
              type="date"
              value={form.date}
              onChange={set("date")}
              error={errors.date}
            />
            <Field label={m.field_time()} type="time" value={form.time} onChange={set("time")} />
          </div>
        ) : null}
        <span className={css({ fontSize: "12px", color: "muted" })}>{m.scrobble_note()}</span>
        <div
          className={css({
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "16px",
            mt: "4px",
          })}
        >
          <Button type="submit" disabled={pending} className={css({ px: "18px" })}>
            {pending ? m.sending() : m.nav_scrobble()}
          </Button>
          <Link
            to="/u/$userName/historique"
            params={{ userName }}
            className={css({ fontSize: "13px" })}
          >
            {m.cancel()}
          </Link>
        </div>
      </form>

      {outcome?.kind === "added" ? (
        <div
          role="status"
          className={css({
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            px: "16px",
            py: "14px",
            borderRadius: "button",
            bg: "successBg",
            color: "successInk",
            fontSize: "13px",
          })}
        >
          <span className={css({ display: "flex", alignItems: "center", gap: "8px" })}>
            <CheckIcon size={14} />
            {m.scrobble_added({ track: outcome.track })}
          </span>
          <Link
            to="/u/$userName/historique"
            params={{ userName }}
            className={css({
              color: "successInk",
              fontWeight: "500",
              _hover: { color: "successInk" },
            })}
          >
            {m.view()}
          </Link>
        </div>
      ) : null}
      {outcome?.kind === "duplicate" ? (
        <div
          role="status"
          className={css({
            px: "16px",
            py: "14px",
            borderRadius: "button",
            bg: "field",
            fontSize: "13px",
            color: "ink",
          })}
        >
          {m.scrobble_duplicate()}
        </div>
      ) : null}
      {outcome?.kind === "failed" ? (
        <div
          role="alert"
          className={css({
            px: "16px",
            py: "14px",
            borderRadius: "button",
            bg: "dangerBg",
            fontSize: "13px",
            color: "dangerInk",
          })}
        >
          {outcome.message}
        </div>
      ) : null}
    </>
  );
}
