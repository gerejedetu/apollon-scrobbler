/**
 * Fills artist_credits (migration 0005) for credits already in the database, so joint listens imported
 * before it count for each artist. New listens fill it themselves. Safe to run again (INSERT OR IGNORE).
 *
 *   vpx scripts/backfill-artist-credits.ts --local
 *   vpx scripts/backfill-artist-credits.ts --remote   (real IDs via scripts/with-cloudflare-ids.mjs)
 */
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { creditPairs } from "@scrobbler/core";

const root = fileURLToPath(new URL("..", import.meta.url));
const remote = process.argv.includes("--remote");

function wrangler(args: string[]): string {
  const cmd = remote
    ? ["node", ["scripts/with-cloudflare-ids.mjs", ...args, "--remote"]]
    : ["npx", ["wrangler", ...args, "--local"]];
  const res = spawnSync(cmd[0] as string, cmd[1] as string[], {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 256 * 1024 * 1024,
  });
  if (res.status !== 0) {
    process.stderr.write(res.stderr ?? "");
    process.exit(res.status ?? 1);
  }
  return res.stdout;
}

const out = wrangler([
  "d1",
  "execute",
  "DB",
  "--json",
  "--command",
  "SELECT DISTINCT artist_name FROM listens",
]);
const parsed = JSON.parse(out.slice(out.indexOf("["))) as { results: { artist_name: string }[] }[];
const credits = parsed.flatMap((r) => r.results.map((row) => row.artist_name));
const pairs = creditPairs(credits);
console.log(`${credits.length} credits, ${pairs.length} (credit, artist) pairs to record.`);
if (pairs.length === 0) process.exit(0);

const quote = (s: string) => `'${s.replace(/'/g, "''")}'`;
const dir = mkdtempSync(join(tmpdir(), "credits-"));
const file = join(dir, "credits.sql");
writeFileSync(
  file,
  pairs
    .map(
      ([c, a]) =>
        `INSERT OR IGNORE INTO artist_credits (credit, artist) VALUES (${quote(c)}, ${quote(a)});`,
    )
    .join("\n"),
);
try {
  wrangler(["d1", "execute", "DB", "--file", file, "--yes"]);
  console.log("Done.");
} finally {
  rmSync(dir, { recursive: true, force: true });
}
