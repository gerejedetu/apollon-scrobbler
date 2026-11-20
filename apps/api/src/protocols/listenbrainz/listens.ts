/** Submitting, listing and deleting listens. */
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import type { AppEnv } from "../../env.ts";
import { jsonBody } from "../../http/errors.ts";
import { requireUser, readableUser } from "../../http/require-user.ts";
import { ApiError } from "@scrobbler/core";

/** 1000 listens of at most 10 KB each, plus envelope. */
const MAX_SUBMIT_BYTES = 11 * 1024 * 1024;

export const listensRoutes = new Hono<AppEnv>()
  .post(
    "/submit-listens",
    bodyLimit({
      maxSize: MAX_SUBMIT_BYTES,
      onError: () => {
        throw new ApiError(413, "Payload too large.");
      },
    }),
    async (c) => {
      const user = await requireUser(c);
      await c.var.services.listens.submit(user, await jsonBody(c));
      return c.json({ status: "ok" });
    },
  )
  .post("/delete-listen", async (c) => {
    const user = await requireUser(c);
    await c.var.services.listens.delete(user, await jsonBody(c));
    return c.json({ status: "ok" });
  })
  .get("/user/:user_name/listens", async (c) => {
    const user = await readableUser(c, c.req.param("user_name"));
    const page = await c.var.services.listens.list(user, c.req.query());
    return c.json({ payload: { ...page, user_id: user.name } });
  })
  .get("/user/:user_name/listen-count", async (c) => {
    const user = await readableUser(c, c.req.param("user_name"));
    return c.json({ payload: { count: user.listenCount } });
  })
  .get("/user/:user_name/playing-now", async (c) => {
    const user = await readableUser(c, c.req.param("user_name"));
    const track = await c.var.services.listens.current(user);
    const listens = track ? [{ playing_now: true, track_metadata: track }] : [];
    return c.json({
      payload: { count: listens.length, listens, playing_now: true, user_id: user.name },
    });
  });
