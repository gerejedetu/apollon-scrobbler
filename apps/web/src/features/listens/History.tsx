import { useState } from "react";
import { css } from "styled-system/css";
import { api, type Listen, type ListensPage } from "../../api/index.ts";
import { formatDate } from "../../lib/format/index.ts";
import { Button, Empty, Notice } from "../../ui/primitives/index.ts";
import { ListenItem } from "./ListenRow.tsx";

export const HISTORY_PAGE = 50;

/** Listens grouped by day, newest first, with "Afficher plus" walking back through `next`. */
export function History({ userName, first }: { userName: string; first: ListensPage }) {
  const [listens, setListens] = useState<Listen[]>(first.listens);
  const [next, setNext] = useState<number | null>(first.next);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  async function more() {
    if (next === null) return;
    setLoading(true);
    setFailed(false);
    try {
      const page = await api.listens.list(userName, { before: next, limit: HISTORY_PAGE });
      setListens((all) => [...all, ...page.listens]);
      setNext(page.next);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }

  if (listens.length === 0) return <Empty>Pas encore d'écoute.</Empty>;

  const days: { day: string; items: Listen[] }[] = [];
  for (const listen of listens) {
    const day = formatDate(listen.listenedAt);
    const last = days.at(-1);
    if (last?.day === day) last.items.push(listen);
    else days.push({ day, items: [listen] });
  }

  return (
    <div className={css({ display: "flex", flexDirection: "column", gap: "28px" })}>
      {days.map(({ day, items }) => (
        <section key={day} className={css({ display: "flex", flexDirection: "column" })}>
          <h2
            className={css({
              m: "0 0 6px",
              textStyle: "label",
              color: "muted",
              textTransform: "uppercase",
            })}
          >
            {day}
          </h2>
          {items.map((l) => (
            <ListenItem key={`${l.listenedAt}/${l.id}`} listen={l} />
          ))}
        </section>
      ))}
      {failed ? <Notice tone="error">Impossible de charger la suite. Réessaie.</Notice> : null}
      {next !== null ? (
        <Button
          tone="outline"
          size="sm"
          onClick={more}
          disabled={loading}
          className={css({ alignSelf: "center" })}
        >
          {loading ? "Chargement…" : "Afficher plus"}
        </Button>
      ) : null}
    </div>
  );
}
