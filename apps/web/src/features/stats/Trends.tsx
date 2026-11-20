import { useState } from "react";
import { css } from "styled-system/css";
import type { Change, Trends as TrendsData } from "../../api/index.ts";
import { barWidth, formatCount } from "../../lib/format/index.ts";
import { displayHeading, Empty } from "../../ui/primitives/index.ts";
import { TextTabs } from "../../ui/zag/index.ts";
import { TREND_ENTITIES } from "./data.ts";

type TrendEntity = (typeof TREND_ENTITIES)[number];

const LABELS: Record<TrendEntity, string> = {
  artists: "Artistes",
  releases: "Albums",
  recordings: "Titres",
};

const nameOf = (c: Change) => c.trackName ?? c.releaseName ?? c.artistName;

function Column({ items, max, rising }: { items: Change[]; max: number; rising: boolean }) {
  return (
    <div
      className={css({ flex: "1 1 380px", display: "flex", flexDirection: "column", gap: "16px" })}
    >
      {items.map((t) => (
        <div
          key={`${t.artistName}/${nameOf(t)}`}
          className={css({ display: "flex", flexDirection: "column", gap: "6px" })}
        >
          <div
            className={css({
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              gap: "12px",
            })}
          >
            <span className={css({ fontSize: "14px", fontWeight: "500" })}>
              {nameOf(t)}
              {t.trackName || t.releaseName ? (
                <span className={css({ color: "muted", fontWeight: "400" })}>
                  {" "}
                  · {t.artistName}
                </span>
              ) : null}
            </span>
            <span
              className={css({ textStyle: "narrow", fontSize: "22px" })}
              style={{ color: rising ? "#1F7A3A" : "#B4232A" }}
            >
              {rising ? "+" : "−"}
              {formatCount(Math.abs(t.change))}
            </span>
          </div>
          <div
            aria-hidden="true"
            className={css({ display: "flex", flexDirection: "column", gap: "3px" })}
          >
            <div
              className={css({ height: "8px", bg: "ink" })}
              style={{ width: barWidth(t.current, max) }}
            />
            <div
              className={css({ height: "8px", bg: "dashed" })}
              style={{ width: barWidth(t.previous, max) }}
            />
          </div>
          <span className={css({ fontSize: "11px", color: "muted" })}>
            {formatCount(t.current)} écoutes, contre {formatCount(t.previous)}
          </span>
        </div>
      ))}
    </div>
  );
}

/** "Ce qui monte, ce qui descend", for artists, albums or tracks (Zag tabs in the heading). */
export function Trends({
  trends,
  currentLabel,
  previousLabel,
}: {
  trends: Record<TrendEntity, TrendsData>;
  currentLabel: string;
  previousLabel: string;
}) {
  const [entity, setEntity] = useState<TrendEntity>("artists");
  return (
    <section className={css({ display: "flex", flexDirection: "column", gap: "20px" })}>
      <TextTabs<TrendEntity>
        label="Quoi"
        value={entity}
        onValueChange={setEntity}
        renderHeading={(list) => (
          <div
            className={css({
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "space-between",
              alignItems: "baseline",
              gap: "8px",
            })}
          >
            <h2 className={displayHeading.narrow}>Ce qui monte, ce qui descend</h2>
            {list}
          </div>
        )}
        items={TREND_ENTITIES.map((e) => {
          const t = trends[e];
          const max = Math.max(
            1,
            ...[...t.rising, ...t.falling].flatMap((c) => [c.current, c.previous]),
          );
          return {
            value: e,
            label: LABELS[e],
            content:
              t.rising.length + t.falling.length === 0 ? (
                <Empty>Rien ne bouge vraiment sur cette période.</Empty>
              ) : (
                <div className={css({ display: "flex", flexWrap: "wrap", gap: "40px" })}>
                  <Column items={t.rising} max={max} rising />
                  <Column items={t.falling} max={max} rising={false} />
                </div>
              ),
          };
        })}
      />
      <span className={css({ display: "flex", gap: "16px", fontSize: "11px", color: "muted" })}>
        <span className={css({ display: "flex", alignItems: "center", gap: "6px" })}>
          <span className={css({ width: "12px", height: "8px", bg: "ink" })} />
          {currentLabel}
        </span>
        <span className={css({ display: "flex", alignItems: "center", gap: "6px" })}>
          <span className={css({ width: "12px", height: "8px", bg: "dashed" })} />
          {previousLabel}
        </span>
      </span>
    </section>
  );
}
