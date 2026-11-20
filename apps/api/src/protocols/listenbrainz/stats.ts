/** `GET /1/stats/user/{user}/{artists|recordings|releases}`. */
import type { StatsEntity } from "@scrobbler/types";
import { Hono } from "hono";
import type { AppEnv } from "../../env.ts";
import { presentStats } from "./stats-presenter.ts";

const ENTITIES: readonly StatsEntity[] = ["artists", "recordings", "releases"];

export const statsRoutes = new Hono<AppEnv>();

for (const entity of ENTITIES) {
  statsRoutes.get(`/stats/user/:user_name/${entity}`, async (c) => {
    const user = await c.var.services.users.requireByName(c.req.param("user_name"));
    const query = c.req.query();
    const result = await c.var.services.stats.top(user, entity, query);
    // ListenBrainz answers 204 when a user has no statistics for the range.
    if (result.total === 0) return c.body(null, 204);
    return c.json(presentStats(user, result, Number(query.offset ?? 0)));
  });
}
