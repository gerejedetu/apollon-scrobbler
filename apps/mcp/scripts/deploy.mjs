#!/usr/bin/env node
/**
 * `wrangler deploy` plus this instance's routes, kept out of git.
 *
 * MCP_ROUTES (comma-separated route patterns, e.g. `scrobbler.example.com/mcp*`) comes from apps/mcp/.env.cloudflare
 * (git-ignored, see .env.cloudflare.example) or the environment. Without it the Worker stays on workers.dev only.
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

const routes = (process.env.MCP_ROUTES ?? "")
  .split(",")
  .map((r) => r.trim())
  .filter(Boolean);
const args = [
  "wrangler",
  "deploy",
  ...routes.flatMap((r) => ["--route", r]),
  ...process.argv.slice(2),
];
const res = spawnSync("npx", args, { cwd: root, stdio: "inherit" });
process.exitCode = res.status ?? 1;
