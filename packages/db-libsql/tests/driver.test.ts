import { expect, test } from "vite-plus/test";
import { createMigratedLibsql } from "../src/testing.ts";

test("D1-style statements, atomic batches and changes() across a batch", async () => {
  const db = createMigratedLibsql();
  await db.exec(
    "CREATE TABLE t (id INTEGER PRIMARY KEY, name TEXT UNIQUE, n INTEGER); CREATE TABLE c (v INTEGER); INSERT INTO c VALUES (0);",
  );
  const ins = db.prepare("INSERT INTO t (name, n) VALUES (?1, ?2)");
  expect((await ins.bind("a", true).run()).meta.changes).toBe(1);
  expect(await db.prepare("SELECT name, n FROM t WHERE id = ?1").bind(1).first()).toEqual({
    name: "a",
    n: 1,
  });
  expect(await db.prepare("SELECT name FROM t WHERE id = ?1").bind(9).first()).toBeNull();

  // A failing statement rolls the whole batch back.
  await expect(db.batch([ins.bind("b", 0), ins.bind("a", 0)])).rejects.toThrow();
  expect((await db.prepare("SELECT count(*) AS n FROM t").all()).results).toEqual([{ n: 1 }]);

  // changes() refers to the previous statement of the same batch (the listen counter relies on it).
  db.roundTrips = 0;
  const [, , bump] = await db.batch([
    db
      .prepare("INSERT OR IGNORE INTO t (name, n) SELECT value, 0 FROM json_each(?1)")
      .bind('["b","c","a"]'),
    db.prepare("UPDATE c SET v = v + changes()"),
    db.prepare("SELECT v FROM c"),
  ]);
  expect(db.roundTrips).toBe(1);
  expect(bump?.results).toEqual([{ v: 2 }]);
});
