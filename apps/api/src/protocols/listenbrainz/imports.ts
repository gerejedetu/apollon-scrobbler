/** `GET|POST /1/latest-import`: where an importer (e.g. from Last.fm) should resume. */
import { Hono } from "hono";
import type { AppEnv } from "../../env.ts";
import { jsonBody } from "../../http/errors.ts";
import { requireUser } from "../../http/require-user.ts";
import { ApiError } from "@scrobbler/core";

export const importRoutes = new Hono<AppEnv>()
  .get("/latest-import", async (c) => {
    const name = c.req.query("user_name");
    if (!name) throw ApiError.badRequest("user_name is required.");
    const user = await c.var.services.users.requireByName(name);
    const latest = await c.var.services.imports.latest(user, c.req.query("service"));
    return c.json({ musicbrainz_id: user.name, latest_import: latest });
  })
  .post("/latest-import", async (c) => {
    const user = await requireUser(c);
    await c.var.services.imports.update(user, await jsonBody(c));
    return c.json({ status: "ok" });
  });
