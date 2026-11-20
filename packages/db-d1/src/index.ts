import type { Repositories } from "@scrobbler/core";
import type { D1Like } from "./d1.ts";
import { d1Imports } from "./repositories/imports.ts";
import { d1Insights } from "./repositories/insights.ts";
import { d1Listens } from "./repositories/listens.ts";
import { d1PlayingNow } from "./repositories/playing-now.ts";
import { d1Stats } from "./repositories/stats.ts";
import { d1Users } from "./repositories/users.ts";

export type { D1Like, D1ResultLike, D1StatementLike } from "./d1.ts";

/** Builds every core repository on top of one D1 database binding. */
export function createD1Repositories(db: D1Like): Repositories {
  return {
    users: d1Users(db),
    listens: d1Listens(db),
    playingNow: d1PlayingNow(db),
    imports: d1Imports(db),
    stats: d1Stats(db),
    insights: d1Insights(db),
  };
}
