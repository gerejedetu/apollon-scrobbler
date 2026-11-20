import { MemoryKV } from "@scrobbler/testing";
import { expect, test } from "vite-plus/test";
import { KvCache } from "../src/index.ts";

test("stores JSON with a prefix and a TTL of at least 60 s", async () => {
  let now = 0;
  const kv = new MemoryKV(() => now);
  const cache = new KvCache(kv, "p:");
  await cache.set("k", { a: 1 }, 10);
  expect(await kv.get("p:k", "json")).toEqual({ a: 1 });
  now = 59_000;
  expect(await cache.get("k")).toEqual({ a: 1 });
  now = 60_000;
  expect(await cache.get("k")).toBeNull();
});

test("failures behave as misses", async () => {
  const broken = {
    get: async () => {
      throw new Error("down");
    },
    put: async () => {
      throw new Error("down");
    },
  };
  const cache = new KvCache(broken);
  await expect(cache.set("k", 1, 60)).resolves.toBeUndefined();
  expect(await cache.get("k")).toBeNull();
});
