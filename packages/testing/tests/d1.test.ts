import { expect, test } from "vite-plus/test";
import { MemoryKV, SqliteD1 } from "../src/index.ts";

test("SqliteD1 supports prepare/bind/first/all/run and atomic batch", async () => {
  const db = new SqliteD1();
  await db.exec("CREATE TABLE t (id INTEGER PRIMARY KEY, name TEXT UNIQUE)");
  const ins = db.prepare("INSERT INTO t (name) VALUES (?)");
  expect((await ins.bind("a").run()).meta.changes).toBe(1);
  expect(await db.prepare("SELECT name FROM t WHERE id = ?").bind(1).first("name")).toBe("a");
  await expect(db.batch([ins.bind("b"), ins.bind("a")])).rejects.toThrow();
  expect((await db.prepare("SELECT * FROM t").all()).results).toHaveLength(1);
  const [, r] = await db.batch([ins.bind("b"), db.prepare("SELECT count(*) AS n FROM t")]);
  expect(r?.results).toEqual([{ n: 2 }]);
});

test("MemoryKV honours expirationTtl", async () => {
  let now = 0;
  const kv = new MemoryKV(() => now);
  await kv.put("k", JSON.stringify({ a: 1 }), { expirationTtl: 60 });
  expect(await kv.get("k", "json")).toEqual({ a: 1 });
  now = 61_000;
  expect(await kv.get("k", "json")).toBeNull();
});
