import { Link } from "@tanstack/react-router";
import { estimateListeningMs } from "../../lib/listening-time.ts";
import { css } from "styled-system/css";
import type { Compare, Range, Summary } from "../../api/index.ts";
import { formatChange, formatCount, formatDate, formatHours } from "../../lib/format/index.ts";
import { RANGES } from "../../lib/ranges.ts";
import { ArrowUpRight } from "../../ui/icons.tsx";
import { capsLabel, pill } from "../../ui/primitives/index.ts";
import { previousLabel } from "./copy.ts";

const wide = css({ textStyle: "wide" });
const serif = css({ fontFamily: "serif", fontStyle: "italic" });

/** The period line and pills, then the sentence "1 204 écoutes, 71 heures de musique et 186 artistes." */
export function Hero({
  userName,
  range,
  summary,
  compare,
}: {
  userName: string;
  range: Range;
  summary: Summary;
  compare: Compare | null;
}) {
  const change = compare?.changePercent.listenCount;
  const from = summary.from > 0 ? summary.from : (summary.firstListenedAt ?? summary.to);
  const days = Math.max(1, Math.ceil((summary.to - from) / 86_400));
  const hours = estimateListeningMs(
    summary.listenCount,
    summary.listeningTime.totalMs,
    summary.listeningTime.listensWithDuration,
  );
  return (
    <section className={css({ display: "flex", flexDirection: "column", gap: "28px" })}>
      <div
        className={css({
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
        })}
      >
        <span className={capsLabel} style={{ letterSpacing: "0.08em" }}>
          DU {formatDate(from).toUpperCase()} AU {formatDate(summary.to).toUpperCase()}
        </span>
        <div
          role="tablist"
          aria-label="Période"
          className={css({ display: "flex", flexWrap: "wrap", gap: "6px" })}
        >
          {RANGES.map((r) => (
            <Link
              key={r.value}
              to="/u/$userName/stats"
              params={{ userName }}
              search={{ periode: r.value }}
              role="tab"
              aria-selected={r.value === range}
              className={pill({ tone: r.value === range ? "on" : "off" })}
              resetScroll={false}
            >
              {r.label}
            </Link>
          ))}
        </div>
      </div>
      <h1
        className={css({ m: 0, fontWeight: "400", lineHeight: 1.02, letterSpacing: "-0.02em" })}
        style={{ fontSize: "clamp(40px, 6.4vw, 76px)" }}
      >
        <span className={wide}>{formatCount(summary.listenCount)} écoutes,</span>
        {hours > 0 ? (
          <span className={serif}> {formatHours(hours).replace(" h", "")} heures de musique</span>
        ) : null}
        <span className={wide}>
          {hours > 0 ? " et" : ""} {formatCount(summary.artistCount)} artistes.
        </span>
      </h1>
      <div className={css({ display: "flex", flexWrap: "wrap", gap: "8px" })}>
        {change !== null && change !== undefined && range !== "all_time" ? (
          <span className={pill({ tone: change >= 0 ? "success" : "off" })}>
            {change >= 0 ? <ArrowUpRight /> : null}
            {formatChange(change)} d'écoutes vs {previousLabel(range)}
          </span>
        ) : null}
        <span className={pill()}>
          {summary.activeDays} jours actifs sur {days}
        </span>
        <span className={pill()}>
          {formatCount(Math.round(summary.averagePerDay))} écoutes par jour
        </span>
      </div>
    </section>
  );
}
