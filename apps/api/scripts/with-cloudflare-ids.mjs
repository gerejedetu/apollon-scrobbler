#!/usr/bin/env node
/**
 * Runs a wrangler command against the real Cloudflare resources (the KV namespace) without committing their IDs.
 *
 * wrangler.jsonc keeps a placeholder ID (enough for `wrangler dev` and tests). This script reads the real
 * ones from apps/api/.env.cloudflare (git-ignored, see .env.cloudflare.example) or the environment,
 * writes a temporary config next to wrangler.jsonc, runs wrangler with it, then deletes it.
 *
 *   node scripts/with-cloudflare-ids.mjs deploy
 *   node scripts/with-cloudflare-ids.mjs secret put TURSO_AUTH_TOKEN
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const envFile = `${root}.env.cloudflare`;
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, "utf8").split("\n")) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line);
    if (m && !line.trimStart().startsWith("#") && process.env[m[1]] === undefined)
      process.env[m[1]] = m[2];
  }
}

const ids = {
  KV_CACHE_ID: "00000000000000000000000000000000",
};
let config = readFileSync(`${root}wrangler.jsonc`, "utf8");
for (const [name, placeholder] of Object.entries(ids)) {
  const value = process.env[name];
  if (!value) {
    console.error(
      `Missing ${name}: set it in apps/api/.env.cloudflare (see .env.cloudflare.example).`,
    );
    process.exit(1);
  }
  config = config.replace(placeholder, value);
}

const temp = `${root}wrangler.deploy.jsonc`;
writeFileSync(temp, config);
try {
  const res = spawnSync("npx", ["wrangler", ...process.argv.slice(2), "--config", temp], {
    cwd: root,
    stdio: "inherit",
  });
  process.exitCode = res.status ?? 1;
} finally {
  rmSync(temp, { force: true });
}
