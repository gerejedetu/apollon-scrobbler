import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { css } from "styled-system/css";
import type { ListensPage, Track } from "../../api/index.ts";
import { formatCount, localDate } from "../../lib/format/index.ts";
import { CalendarIcon, ChevronDown, ChevronLeft, ChevronRight } from "../../ui/icons.tsx";
import { Button, Empty, input } from "../../ui/primitives/index.ts";
import { dropdownTrigger, Popover, SelectMenu } from "../../ui/zag/index.ts";
import { localToUnix } from "../scrobble/index.ts";
import { HistoryListen, HistoryNowPlaying } from "./HistoryRow.tsx";
import {
  type HistorySearch,
  neighbours,
  PAGE_SIZES,
  type PageSize,
  pageNumbers,
  pageRange,
} from "./pages.ts";

const weekdayDate = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});
const weekdayDateYear = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/** Day headers: "Aujourd'hui · vendredi 20 novembre", "Hier · …", then the date itself. */
function dayTitle(seconds: number, now: number) {
  const day = localDate(seconds).toISOString().slice(0, 10);
  const today = localDate(now).toISOString().slice(0, 10);
  const yesterday = localDate(now - 86_400)
    .toISOString()
    .slice(0, 10);
  const sameYear = day.slice(0, 4) === today.slice(0, 4);
  const full = (sameYear ? weekdayDate : weekdayDateYear).format(localDate(seconds));
  if (day === today) return { key: day, title: "Aujourd'hui", note: full };
  if (day === yesterday) return { key: day, title: "Hier", note: full };
  return { key: day, title: full.charAt(0).toUpperCase() + full.slice(1), note: "" };
}

const pagerLink = css({
  minWidth: "32px",
  height: "32px",
  px: "8px",
  boxSizing: "border-box",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "button",
  textDecoration: "none",
  fontWeight: "500",
  color: "ink",
  "&[aria-current=page]": { border: "1px solid token(colors.ink)" },
});

/** "Historique": every listen, newest first, by day, with paging and a jump to a date. */
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
  const size: PageSize = search.taille ?? 50;
  const number = search.avant === undefined && search.apres === undefined ? 1 : search.page;
  const { older, newer } = neighbours(page, { ...search, page: number }, size);
  const last = Math.max(1, Math.ceil(total / size));
  const now = Date.now() / 1000;
  const [date, setDate] = useState("");
  const go = (s: HistorySearch) =>
    navigate({ to: "/u/$userName/historique", params: { userName }, search: s });

  const groups: { key: string; title: string; note: string; items: ListensPage["listens"] }[] = [];
  for (const l of page.listens) {
    const d = dayTitle(l.listenedAt, now);
    const g = groups.at(-1);
    if (g?.key === d.key) g.items.push(l);
    else groups.push({ ...d, items: [l] });
  }
  if (number === 1 && nowPlaying && groups[0]?.title !== "Aujourd'hui") {
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
            Historique
          </h1>
          <span className={css({ fontSize: "13px", color: "muted" })}>
            <b className={css({ color: "ink", fontWeight: "600" })}>{formatCount(total)}</b>{" "}
            écoutes, de la plus récente à la plus ancienne
          </span>
        </div>
        <Popover
          label="Aller à une date"
          triggerClassName={dropdownTrigger}
          trigger={
            <>
              <CalendarIcon />
              Aller à une date
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
                void go({ avant: midnight + 86_400, taille: size });
              }}
            >
              <input
                type="date"
                aria-label="Date"
                value={date}
                max={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setDate(e.target.value)}
                className={input}
                style={{ width: 170 }}
              />
              <Button type="submit" size="sm" disabled={!date}>
                Aller
              </Button>
            </form>
          )}
        </Popover>
      </div>

      {page.listens.length === 0 && !nowPlaying ? (
        <Empty>Pas d'écoute à cet endroit de ton historique.</Empty>
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
              {i === 0 && number === 1 && nowPlaying ? (
                <HistoryNowPlaying userName={userName} track={nowPlaying} />
              ) : null}
              {g.items.map((l) => (
                <HistoryListen key={`${l.listenedAt}/${l.id}`} userName={userName} listen={l} />
              ))}
            </div>
          ))}
        </section>
      )}

      <nav
        aria-label="Pagination"
        className={css({
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "16px",
          fontSize: "13px",
        })}
      >
        <div
          className={css({ display: "flex", alignItems: "center", gap: "16px", color: "muted" })}
        >
          <span className={css({ display: "flex", alignItems: "center", gap: "8px" })}>
            Afficher
            <SelectMenu<string>
              label="Écoutes par page"
              value={String(size)}
              options={PAGE_SIZES.map((n) => ({ value: String(n), label: String(n) }))}
              onValueChange={(v) => void go({ taille: Number(v) as PageSize })}
            />
          </span>
          {pageRange(number, size, page.listens.length) ? (
            <span>
              <b className={css({ color: "ink", fontWeight: "600" })}>
                {pageRange(number, size, page.listens.length)}
              </b>{" "}
              sur {formatCount(total)} écoutes
            </span>
          ) : null}
        </div>
        <div className={css({ display: "flex", alignItems: "center", gap: "4px" })}>
          {newer ? (
            <Link
              to="/u/$userName/historique"
              params={{ userName }}
              search={newer}
              className={css({
                height: "32px",
                pl: "6px",
                pr: "10px",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                textDecoration: "none",
                fontWeight: "500",
                color: "ink",
              })}
            >
              <ChevronLeft size={14} />
              Précédent
            </Link>
          ) : (
            <span
              aria-disabled="true"
              className={css({
                height: "32px",
                pl: "6px",
                pr: "10px",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                color: "dashed",
              })}
            >
              <ChevronLeft size={14} />
              Précédent
            </span>
          )}
          {number
            ? pageNumbers(number, last).map((n, i) =>
                n === null ? (
                  <span
                    key={`gap${i}`}
                    aria-hidden="true"
                    className={css({ minWidth: "24px", textAlign: "center", color: "muted" })}
                  >
                    …
                  </span>
                ) : (
                  <Link
                    key={n}
                    to="/u/$userName/historique"
                    params={{ userName }}
                    aria-label={`Page ${formatCount(n)}`}
                    aria-current={n === number ? "page" : undefined}
                    search={
                      n === 1
                        ? { taille: size }
                        : n === number
                          ? search
                          : n === number - 1 && newer
                            ? newer
                            : n === number + 1 && older
                              ? older
                              : {
                                  apres: (page.oldestListenedAt ?? 1) - 1,
                                  page: last,
                                  taille: size,
                                }
                    }
                    className={pagerLink}
                  >
                    {formatCount(n)}
                  </Link>
                ),
              )
            : null}
          {older ? (
            <Link
              to="/u/$userName/historique"
              params={{ userName }}
              search={older}
              className={css({
                height: "32px",
                pl: "10px",
                pr: "6px",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                textDecoration: "none",
                fontWeight: "500",
                color: "ink",
              })}
            >
              Suivant
              <ChevronRight size={14} />
            </Link>
          ) : null}
        </div>
      </nav>
    </>
  );
}
