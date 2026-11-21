import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { css } from "styled-system/css";
import { api, type ListensPage, type Track } from "../../api/index.ts";
import { formatCount, localDate } from "../../lib/format/index.ts";
import { dateFormat } from "../../lib/locale.ts";
import { CalendarIcon, ChevronDown } from "../../ui/icons.tsx";
import { LoadMore } from "../../ui/feedback/index.ts";
import { Button, Empty, input } from "../../ui/primitives/index.ts";
import { dropdownTrigger, Popover } from "../../ui/zag/index.ts";
import { localToUnix } from "../scrobble/index.ts";
import { HistoryListen, HistoryNowPlaying } from "./HistoryRow.tsx";
import { type HistorySearch, olderCursor, PAGE_SIZE } from "./pages.ts";
import { m } from "../../paraglide/messages.js";

const weekdayDate = () =>
  dateFormat({ weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
const weekdayDateYear = () =>
  dateFormat({ weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

/** Day headers: "Aujourd'hui · vendredi 20 novembre", "Hier · …", then the date itself. */
function dayTitle(seconds: number, now: number) {
  const day = localDate(seconds).toISOString().slice(0, 10);
  const today = localDate(now).toISOString().slice(0, 10);
  const yesterday = localDate(now - 86_400)
    .toISOString()
    .slice(0, 10);
  const sameYear = day.slice(0, 4) === today.slice(0, 4);
  const full = (sameYear ? weekdayDate() : weekdayDateYear()).format(localDate(seconds));
  if (day === today) return { key: day, title: m.today_title(), note: full };
  if (day === yesterday) return { key: day, title: m.yesterday_title(), note: full };
  return { key: day, title: full.charAt(0).toUpperCase() + full.slice(1), note: "" };
}

/** "Historique": every listen, newest first, by day; older ones load as the page scrolls. */
export function HistoryPage({
  userName,
  page,
  total,
  nowPlaying,
  search,
}: {
  userName: string;
  page: ListensPage;
  total: number;
  nowPlaying: Track | null;
  search: HistorySearch;
}) {
  const navigate = useNavigate();
  const atStart = search.avant === undefined;
  const now = Date.now() / 1000;
  const [date, setDate] = useState("");
  const [listens, setListens] = useState(page.listens);
  const [cursor, setCursor] = useState(() => olderCursor(page));
  const [loading, setLoading] = useState(false);
  const go = (s: HistorySearch) =>
    navigate({ to: "/u/$userName/historique", params: { userName }, search: s });

  async function more() {
    if (cursor === null || loading) return;
    setLoading(true);
    try {
      const next = await api.listens.list(userName, { before: cursor, limit: PAGE_SIZE });
      setListens((l) => [...l, ...next.listens]);
      setCursor(olderCursor(next));
    } finally {
      setLoading(false);
    }
  }

  const groups: { key: string; title: string; note: string; items: ListensPage["listens"] }[] = [];
  for (const l of listens) {
    const d = dayTitle(l.listenedAt, now);
    const g = groups.at(-1);
    if (g?.key === d.key) g.items.push(l);
    else groups.push({ ...d, items: [l] });
  }
  if (atStart && nowPlaying && groups[0]?.title !== m.today_title()) {
    groups.unshift({ ...dayTitle(now, now), items: [] });
  }

  return (
    <>
      <div
        className={css({
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "flex-end",
          gap: "16px",
        })}
      >
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
            {m.nav_history()}
          </h1>
          <span className={css({ fontSize: "13px", color: "muted" })}>
            <b className={css({ color: "ink", fontWeight: "600" })}>{formatCount(total)}</b>{" "}
            {m.history_sub()}
          </span>
        </div>
        <Popover
          label={m.history_goto()}
          triggerClassName={dropdownTrigger}
          trigger={
            <>
              <CalendarIcon />
              {m.history_goto()}
              <ChevronDown size={14} />
            </>
          }
        >
          {(close) => (
            <form
              className={css({ display: "flex", gap: "8px", alignItems: "center" })}
              onSubmit={(e) => {
                e.preventDefault();
                const midnight = localToUnix(date, "00:00");
                if (midnight === undefined) return;
                close();
                void go({ avant: midnight + 86_400 });
              }}
            >
              <input
                type="date"
                aria-label={m.field_date()}
                value={date}
                max={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setDate(e.target.value)}
                className={input}
                style={{ width: 170 }}
              />
              <Button type="submit" size="sm" disabled={!date}>
                {m.go()}
              </Button>
            </form>
          )}
        </Popover>
      </div>

      {listens.length === 0 && !nowPlaying ? (
        <Empty>{m.history_empty()}</Empty>
      ) : (
        <section className={css({ display: "flex", flexDirection: "column" })}>
          {groups.map((g, i) => (
            <div key={g.key} className={css({ display: "flex", flexDirection: "column" })}>
              <div
                className={css({
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  pt: "24px",
                  pb: "10px",
                  borderBottom: "2px solid token(colors.ink)",
                })}
              >
                <span className={css({ textStyle: "wide", fontSize: "15px" })}>{g.title}</span>
                <span className={css({ fontSize: "12px", color: "muted" })}>{g.note}</span>
              </div>
              {i === 0 && atStart && nowPlaying ? (
                <HistoryNowPlaying userName={userName} track={nowPlaying} />
              ) : null}
              {g.items.map((l) => (
                <HistoryListen key={`${l.listenedAt}/${l.id}`} userName={userName} listen={l} />
              ))}
            </div>
          ))}
        </section>
      )}

      {cursor !== null ? (
        <LoadMore
          onMore={() => void more()}
          loading={loading}
          label={m.show_more()}
          loadingLabel={m.loading()}
        />
      ) : null}
    </>
  );
}
