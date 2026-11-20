import { describe, expect, test, vi } from "vite-plus/test";
import { apiTarget } from "./env.ts";
import { forwardToApi, isApiPath } from "./proxy.ts";

describe("isApiPath", () => {
  test.each(["/api/auth/sign-in/email", "/v1/me", "/v1", "/1/submit-listens", "/1"])(
    "%s goes to the API",
    (path) => expect(isApiPath(path)).toBe(true),
  );
  test.each(["/", "/connexion", "/u/jules/stats", "/v10", "/1x", "/api/other"])(
    "%s is a page",
    (path) => expect(isApiPath(path)).toBe(false),
  );
});

describe("forwardToApi", () => {
  test("through the binding, the request keeps the browser's origin", async () => {
    const fetch = vi.fn(async (r: Request) => new Response(r.url));
    const res = await forwardToApi(new Request("https://needle.example/v1/me?x=1"), {
      binding: { fetch },
    });
    expect(await res.text()).toBe("https://needle.example/v1/me?x=1");
  });

  test("with an origin, path and query move to that origin", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      return new Response(input instanceof Request ? input.url : String(input));
    });
    const res = await forwardToApi(
      new Request("http://localhost:3000/1/user/jules/listens?count=2"),
      {
        origin: "http://localhost:8787",
      },
    );
    expect(await res.text()).toBe("http://localhost:8787/1/user/jules/listens?count=2");
    spy.mockRestore();
  });

  test("without a target, a 503 in the API's error shape", async () => {
    const res = await forwardToApi(new Request("https://needle.example/v1/me"), {});
    expect(res.status).toBe(503);
    expect(await res.json()).toMatchObject({ code: 503 });
  });
});

describe("apiTarget", () => {
  test("API_ORIGIN (local dev) wins over the binding", () => {
    const binding = { fetch: async () => new Response() };
    expect(apiTarget({ API: binding, API_ORIGIN: "http://localhost:8787" })).toEqual({
      origin: "http://localhost:8787",
    });
    expect(apiTarget({ API: binding })).toEqual({ binding });
  });
});
