import { describe, expect, test } from "vite-plus/test";
import { createEndpoints } from "./endpoints.ts";
import { ApiError, isNotFound, isUnauthorized } from "./error.ts";
import { createHttp, withQuery } from "./http.ts";

function recorder(respond: (path: string, init?: RequestInit) => Response) {
  const calls: { path: string; init?: RequestInit }[] = [];
  const http = createHttp(async (path, init) => {
    calls.push({ path, init });
    return respond(path, init);
  });
  return { calls, http };
}

describe("withQuery", () => {
  test("drops empty values and encodes the rest", () => {
    expect(withQuery("/v1/x", { range: "this_month", limit: 5, a: undefined, b: null })).toBe(
      "/v1/x?range=this_month&limit=5",
    );
    expect(withQuery("/v1/x")).toBe("/v1/x");
  });
});

describe("http client", () => {
  test("GET parses JSON", async () => {
    const { http } = recorder(() => Response.json({ ok: 1 }));
    expect(await http.get("/v1/me")).toEqual({ ok: 1 });
  });

  test("a body is sent as JSON", async () => {
    const { http, calls } = recorder(() => Response.json({}));
    await http.patch("/v1/me", { private: true });
    expect(calls[0]?.init?.method).toBe("PATCH");
    expect(calls[0]?.init?.body).toBe('{"private":true}');
    const headers = (calls[0]?.init?.headers ?? {}) as Record<string, string>;
    expect(headers["content-type"]).toBe("application/json");
  });

  test("errors carry the API's status and message", async () => {
    const { http } = recorder(() =>
      Response.json({ code: 404, error: "No such user." }, { status: 404 }),
    );
    const error = await http.get("/v1/users/x/listens").catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).message).toBe("No such user.");
    expect(isNotFound(error)).toBe(true);
    expect(isUnauthorized(error)).toBe(false);
  });

  test("a non-JSON error keeps the status text", async () => {
    const { http } = recorder(
      () => new Response("nope", { status: 502, statusText: "Bad Gateway" }),
    );
    await expect(http.get("/v1/me")).rejects.toThrow("Bad Gateway");
  });

  test("204 resolves to undefined", async () => {
    const { http } = recorder(() => new Response(null, { status: 204 }));
    expect(await http.delete("/v1/listens/1/a")).toBeUndefined();
  });
});

describe("endpoints", () => {
  test("names in paths are encoded, parameters go to the query", async () => {
    const { http, calls } = recorder(() => Response.json({}));
    const api = createEndpoints(http);
    await api.library.album("jules", "AC/DC", "Back in Black?", { range: "all_time" });
    await api.stats.top("jules", "releases", { range: "this_month", limit: 5 });
    expect(calls.map((c) => c.path)).toEqual([
      "/v1/users/jules/albums/AC%2FDC/Back%20in%20Black%3F?range=all_time",
      "/v1/users/jules/stats/releases?range=this_month&limit=5",
    ]);
  });
});
