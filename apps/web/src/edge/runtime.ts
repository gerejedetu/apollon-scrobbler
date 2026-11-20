/** The Worker's bindings, read lazily so client bundles and tests never import `cloudflare:workers`. */
import type { WebEnv } from "./env.ts";

export async function workerEnv(): Promise<WebEnv> {
  const mod = (await import("cloudflare:workers")) as { env: WebEnv };
  return mod.env;
}
