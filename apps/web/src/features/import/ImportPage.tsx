import { useRouter } from "@tanstack/react-router";
import { type ChangeEvent, useState } from "react";
import { css } from "styled-system/css";
import { api } from "../../api/index.ts";
import { forgetViewer } from "../../auth/index.ts";
import { formatCount, formatDate } from "../../lib/format/index.ts";
import { Button, Notice } from "../../ui/primitives/index.ts";
import { settingsTitle } from "../settings/index.ts";
import { batches, type ParsedExport, parseLastFmExport } from "./lastfm.ts";

type State =
  | { step: "pick" }
  | { step: "ready"; file: string; parsed: ParsedExport }
  | { step: "sending"; parsed: ParsedExport; done: number; inserted: number }
  | { step: "done"; parsed: ParsedExport; inserted: number }
  | { step: "failed"; message: string; parsed?: ParsedExport; inserted?: number };

const box = css({
  p: "24px",
  bg: "panel",
  borderRadius: "card",
  display: "flex",
  flexDirection: "column",
  gap: "14px",
});
const muted = css({ fontSize: "13px", color: "muted", lineHeight: "20px" });

/**
 * "Importer mon historique": a Last.fm CSV export is read in the browser and sent in batches of 1000
 * to POST /v1/listens with the session. Importing twice is harmless (the API drops duplicates).
 */
export function ImportPage() {
  const router = useRouter();
  const [state, setState] = useState<State>({ step: "pick" });

  async function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const parsed = parseLastFmExport(await file.text());
      if (parsed.listens.length === 0)
        setState({ step: "failed", message: "Aucune écoute à importer dans ce fichier." });
      else setState({ step: "ready", file: file.name, parsed });
    } catch (e) {
      setState({ step: "failed", message: e instanceof Error ? e.message : "Fichier illisible." });
    }
  }

  async function send(parsed: ParsedExport) {
    let done = 0;
    let inserted = 0;
    setState({ step: "sending", parsed, done, inserted });
    try {
      for (const batch of batches(parsed.listens)) {
        const res = await api.listens.submit(batch);
        done += batch.length;
        inserted += res.inserted;
        setState({ step: "sending", parsed, done, inserted });
      }
      setState({ step: "done", parsed, inserted });
      forgetViewer();
      await router.invalidate();
    } catch (e) {
      setState({
        step: "failed",
        parsed,
        inserted,
        message: `Import interrompu après ${formatCount(done)} écoutes : ${e instanceof Error ? e.message : "erreur inconnue"}. Relance-le : les écoutes déjà importées ne seront pas doublées.`,
      });
    }
  }

  return (
    <>
      <div className={css({ display: "flex", flexDirection: "column", gap: "8px" })}>
        <h1 className={settingsTitle}>Importer</h1>
        <p
          className={css({
            m: 0,
            maxWidth: "560px",
            fontSize: "13px",
            lineHeight: "20px",
            color: "muted",
          })}
        >
          Récupère ton historique Last.fm : exporte tes scrobbles en CSV, puis choisis le fichier
          ici. Il est lu dans ton navigateur et tes écoutes sont ajoutées à ton compte. Tu peux
          réimporter sans risque, les doublons sont ignorés.
        </p>
      </div>

      {state.step === "pick" || state.step === "failed" ? (
        <label className={box}>
          <span className={css({ fontSize: "14px", fontWeight: "500" })}>Fichier CSV Last.fm</span>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={onFile}
            className={css({ fontSize: "13px" })}
          />
        </label>
      ) : null}

      {state.step === "failed" ? <Notice tone="error">{state.message}</Notice> : null}

      {state.step === "ready" ? (
        <section className={box}>
          <span className={css({ fontSize: "14px", fontWeight: "600" })}>{state.file}</span>
          <span className={muted}>
            {formatCount(state.parsed.listens.length)} écoutes
            {state.parsed.from && state.parsed.to
              ? `, du ${formatDate(state.parsed.from)} au ${formatDate(state.parsed.to)}`
              : ""}
            {state.parsed.skipped
              ? ` · ${formatCount(state.parsed.skipped)} lignes incomplètes ignorées`
              : ""}
            .
          </span>
          <span className={css({ display: "flex", gap: "8px" })}>
            <Button onClick={() => send(state.parsed)}>Importer mon historique</Button>
            <Button tone="outline" onClick={() => setState({ step: "pick" })}>
              Changer de fichier
            </Button>
          </span>
        </section>
      ) : null}

      {state.step === "sending" ? (
        <section className={box} aria-live="polite">
          <span className={css({ fontSize: "14px", fontWeight: "500" })}>
            Import en cours… {formatCount(state.done)} / {formatCount(state.parsed.listens.length)}
          </span>
          <div className={css({ height: "6px", bg: "ruleSoft" })}>
            <div
              className={css({ height: "6px", bg: "violet", transition: "width 200ms" })}
              style={{ width: `${Math.round((state.done / state.parsed.listens.length) * 100)}%` }}
            />
          </div>
        </section>
      ) : null}

      {state.step === "done" ? (
        <Notice tone="success">
          Import terminé : {formatCount(state.inserted)} nouvelles écoutes ajoutées
          {state.parsed.listens.length > state.inserted
            ? `, ${formatCount(state.parsed.listens.length - state.inserted)} déjà présentes`
            : ""}
          .
        </Notice>
      ) : null}
    </>
  );
}
