#!/usr/bin/env node
/**
 * `wrangler deploy` plus this instance's custom domains, kept out of git.
 *
 * WEB_DOMAINS (comma-separated hostnames, e.g. `scrobbler.example.com`) comes from apps/web/.env.cloudflare
 * (git-ignored, see .env.cloudflare.example) or the environment. Without it the Worker stays on workers.dev only.
 * Each hostname must belong to a zone of the Cloudflare account; wrangler creates the DNS record and certificate.
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
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

const domains = (process.env.WEB_DOMAINS ?? "")
  .split(",")
  .map((d) => d.trim())
  .filter(Boolean);
const args = [
  "wrangler",
  "deploy",
  ...domains.flatMap((d) => ["--domain", d]),
  ...process.argv.slice(2),
];
const res = spawnSync("npx", args, { cwd: root, stdio: "inherit" });
process.exitCode = res.status ?? 1;
