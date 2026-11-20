import { Link, useRouter } from "@tanstack/react-router";
import { type DragEvent, useRef, useState } from "react";
import { css } from "styled-system/css";
import { api } from "../../api/index.ts";
import { forgetViewer } from "../../auth/index.ts";
import { formatCount } from "../../lib/format/index.ts";
import { CheckIcon } from "../../ui/icons.tsx";
import { Button, capsLabel } from "../../ui/primitives/index.ts";
import { settingsTitle } from "../settings/index.ts";
import { batches, NotALastFmExport, parseLastFmExport } from "./lastfm.ts";

interface Sending {
  file: string;
  size: number;
  total: number;
  sent: number;
}

type State =
  | { step: "pick" }
  | ({ step: "sending" } & Sending)
  | { step: "done"; inserted: number; ignored: number; cancelled: boolean }
  | { step: "failed"; message: string };

const NOT_LASTFM =
  "Ce fichier ne ressemble pas à un export Last.fm. Il doit contenir les colonnes artiste, album, titre et date.";

const sizeLabel = (bytes: number) =>
  bytes >= 1_000_000
    ? `${(bytes / 1_000_000).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} Mo`
    : `${Math.max(1, Math.round(bytes / 1000))} ko`;

// Literal objects: Panda extracts styles at build time.
const intro = css({ display: "flex", flexDirection: "column", gap: "12px" });
const field = css({ display: "flex", flexDirection: "column", gap: "8px" });
const block = css({ display: "flex", flexDirection: "column", gap: "10px" });

/**
 * "Importer": drop a Last.fm CSV export; it is read in the browser and sent in batches of 1000 to
 * POST /v1/listens with the session. The import can be cancelled between batches, and re-importing is
 * harmless (the API ignores duplicates).
 */
export function ImportPage() {
  const router = useRouter();
  const [state, setState] = useState<State>({ step: "pick" });
  const [dragging, setDragging] = useState(false);
  const cancelled = useRef(false);

  async function start(file: File) {
    let parsed;
    try {
      parsed = parseLastFmExport(await file.text());
    } catch (e) {
      setState({
        step: "failed",
        message: e instanceof NotALastFmExport ? NOT_LASTFM : "Ce fichier est illisible.",
      });
      return;
    }
    if (parsed.listens.length === 0) {
      setState({ step: "failed", message: "Aucune écoute à importer dans ce fichier." });
      return;
    }
    cancelled.current = false;
    const base = { file: file.name, size: file.size, total: parsed.listens.length };
    let sent = 0;
    let inserted = 0;
    setState({ step: "sending", ...base, sent });
    try {
      for (const batch of batches(parsed.listens)) {
        if (cancelled.current) break;
        const res = await api.listens.submit(batch);
        sent += batch.length;
        inserted += res.inserted;
        setState({ step: "sending", ...base, sent });
      }
      setState({ step: "done", inserted, ignored: sent - inserted, cancelled: cancelled.current });
      forgetViewer();
      await router.invalidate();
    } catch (e) {
      setState({
        step: "failed",
        message: `Import interrompu après ${formatCount(sent)} écoutes (${e instanceof Error ? e.message : "erreur inconnue"}). Relance-le : les écoutes déjà importées ne seront pas doublées.`,
      });
    }
  }

  function onDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) void start(file);
  }

  const me = router.state.matches.find((m) => m.routeId === "/reglages")?.context as
    | { me?: { userName: string } }
    | undefined;

  return (
    <>
      <div className={intro}>
        <h1 className={settingsTitle}>Importer</h1>
        <p
          className={css({
            m: 0,
            maxWidth: "560px",
            fontSize: "14px",
            lineHeight: "22px",
            color: "muted",
          })}
        >
          Récupère ton historique Last.fm : exporte tes scrobbles en CSV, puis choisis le fichier
          ici. Il est lu dans ton navigateur et tes écoutes sont ajoutées à ton compte. Tu peux
          réimporter sans risque, les doublons sont ignorés.
        </p>
      </div>

      {state.step !== "sending" ? (
        <section className={field}>
          <span className={css({ fontSize: "13px", fontWeight: "500" })}>Fichier CSV Last.fm</span>
          <label
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={css({
              position: "relative",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "12px",
              px: "24px",
              py: "40px",
              border: "1.5px dashed #CFCFCF",
              borderRadius: "card",
              bg: "#FAFAFA",
              textAlign: "center",
              cursor: "pointer",
              "&[data-dragging=true]": { borderColor: "violet", bg: "violetSoft" },
              "&:focus-within": { borderColor: "violet" },
            })}
            data-dragging={dragging}
          >
            <input
              type="file"
              accept=".csv,text/csv"
              aria-label="Fichier CSV Last.fm"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (file) void start(file);
              }}
              className={css({ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" })}
            />
            <span
              className={css({
                width: "44px",
                height: "44px",
                borderRadius: "22px",
                bg: "#EFEAFF",
                color: "violet",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              })}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 16V4M7 9l5-5 5 5M5 20h14" />
              </svg>
            </span>
            <span className={css({ fontSize: "14px", fontWeight: "500" })}>
              Glisse ton fichier ici ou{" "}
              <span className={css({ color: "violet", textDecoration: "underline" })}>
                choisis-le
              </span>
            </span>
            <span className={css({ fontSize: "12px", color: "muted" })}>
              Un fichier .csv avec artiste, album, titre et date
            </span>
          </label>
        </section>
      ) : null}

      {state.step === "sending" ? (
        <section className={block} style={{ paddingTop: 24, borderTop: "1px solid #EBEBEB" }}>
          <span className={capsLabel}>IMPORT EN COURS</span>
          <div
            className={css({
              display: "flex",
              flexDirection: "column",
              gap: "14px",
              p: "18px",
              border: "1px solid token(colors.rule)",
              borderRadius: "card",
            })}
          >
            <div className={css({ display: "flex", alignItems: "center", gap: "12px" })}>
              <span
                className={css({
                  width: "36px",
                  height: "36px",
                  flexShrink: 0,
                  borderRadius: "button",
                  bg: "field",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                })}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#111111"
                  strokeWidth="2"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M6 3h8l4 4v14H6z" />
                  <path d="M14 3v4h4" />
                </svg>
              </span>
              <span
                className={css({
                  flex: 1,
                  minWidth: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: "2px",
                })}
              >
                <span
                  className={css({
                    fontSize: "13px",
                    fontWeight: "500",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  })}
                >
                  {state.file}
                </span>
                <span className={css({ fontSize: "12px", color: "muted" })}>
                  {sizeLabel(state.size)} · {formatCount(state.total)} écoutes trouvées
                </span>
              </span>
              <Button
                tone="outline"
                size="xs"
                className={css({ height: "32px" })}
                onClick={() => {
                  cancelled.current = true;
                }}
              >
                Annuler
              </Button>
            </div>
            <div
              role="progressbar"
              aria-label="Progression de l'import"
              aria-valuenow={Math.round((state.sent / state.total) * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
              className={css({
                height: "6px",
                borderRadius: "3px",
                bg: "chip",
                overflow: "hidden",
              })}
            >
              <div
                className={css({ height: "6px", bg: "violet", transition: "width 200ms" })}
                style={{ width: `${Math.round((state.sent / state.total) * 100)}%` }}
              />
            </div>
            <div
              className={css({
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "space-between",
                gap: "8px",
                fontSize: "12px",
                color: "muted",
              })}
            >
              <span>
                <b className={css({ color: "ink", fontWeight: "600" })}>
                  {formatCount(state.sent)}
                </b>{" "}
                sur {formatCount(state.total)} écoutes envoyées
              </span>
              <span>Garde cet onglet ouvert jusqu'à la fin</span>
            </div>
          </div>
        </section>
      ) : null}

      {state.step === "done" ? (
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
            <span>
              <b className={css({ fontWeight: "600" })}>
                {formatCount(state.inserted)} écoute{state.inserted > 1 ? "s" : ""} ajoutée
                {state.inserted > 1 ? "s" : ""}.
              </b>
              {state.ignored > 0
                ? ` ${formatCount(state.ignored)} étai${state.ignored > 1 ? "ent" : "t"} déjà là et ${state.ignored > 1 ? "ont" : "a"} été ignorée${state.ignored > 1 ? "s" : ""}.`
                : ""}
              {state.cancelled ? " Import annulé avant la fin." : ""}
            </span>
          </span>
          {me?.me ? (
            <Link
              to="/u/$userName/historique"
              params={{ userName: me.me.userName }}
              className={css({
                color: "successInk",
                fontWeight: "500",
                _hover: { color: "successInk" },
              })}
            >
              Voir mon historique
            </Link>
          ) : null}
        </div>
      ) : null}

      {state.step === "failed" ? (
        <div
          role="alert"
          className={css({
            px: "16px",
            py: "14px",
            borderRadius: "button",
            bg: "dangerBg",
            color: "dangerInk",
            fontSize: "13px",
            lineHeight: "20px",
          })}
        >
          {state.message}
        </div>
      ) : null}
    </>
  );
}
