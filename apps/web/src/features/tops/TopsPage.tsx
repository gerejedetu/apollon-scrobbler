import { useState } from "react";
import { api, type Range, type Top } from "../../api/index.ts";
import { KINDS, type Kind } from "./kinds.ts";
import { TopList } from "./TopList.tsx";

export const TOP_PAGE = 50;

/** A full top list that grows by pages of 50. */
export function TopsPage({
  userName,
  kind,
  range,
  first,
}: {
  userName: string;
  kind: Kind;
  range: Range;
  first: Top;
}) {
  const [top, setTop] = useState(first);
  const [loading, setLoading] = useState(false);

  async function more() {
    setLoading(true);
    try {
      const page = await api.stats.top(userName, KINDS[kind].entity, {
        range,
        limit: TOP_PAGE,
        offset: top.items.length,
      });
      setTop((t) => ({ ...t, items: [...t.items, ...page.items] }));
    } finally {
      setLoading(false);
    }
  }

  return (
    <TopList
      userName={userName}
      kind={kind}
      top={top}
      range={range}
      onMore={more}
      loadingMore={loading}
    />
  );
}
