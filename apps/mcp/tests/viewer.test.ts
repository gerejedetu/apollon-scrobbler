import type { Endpoints, Me } from "@scrobbler/client";
import { describe, expect, test } from "vite-plus/test";
import { memoryViewerCache, resolveViewer } from "../src/http/viewer.ts";

const ME: Me = { userName: "Alice", listenCount: 3, createdAt: 0, private: false };

function fakeApi() {
  let calls = 0;
  const api = { me: { get: async () => (calls++, ME) } } as unknown as Endpoints;
  return { api, calls: () => calls };
}

describe("viewer cache", () => {
  test("asks the API once per token while the entry is fresh", async () => {
    const { api, calls } = fakeApi();
    const cache = memoryViewerCache(1000);
    expect(await resolveViewer(api, "Token a", cache, 0)).toEqual(ME);
    await resolveViewer(api, "Token a", cache, 999);
    expect(calls()).toBe(1);
    await resolveViewer(api, "Token b", cache, 999);
    expect(calls()).toBe(2);
    await resolveViewer(api, "Token a", cache, 1000);
    expect(calls()).toBe(3);
  });

  test("stays bounded, dropping the oldest entry", async () => {
    const cache = memoryViewerCache(1000, 2);
    cache.set("a", ME, 0);
    cache.set("b", ME, 0);
    cache.set("c", ME, 0);
    expect(cache.get("a", 1)).toBeUndefined();
    expect(cache.get("c", 1)).toEqual(ME);
  });
});
