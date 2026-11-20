import { ApiError } from "./error.ts";
import type { Transport } from "./transport.ts";

export type Query = Record<string, string | number | boolean | null | undefined>;

export function withQuery(path: string, query: Query = {}): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null) params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

/** A path segment from user data (artist names can hold `/`, `?`, `#`). */
export const segment = (value: string) => encodeURIComponent(value);

/** JSON client over a transport. Non-2xx answers throw an `ApiError`. */
export function createHttp(transport: Transport) {
  async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const headers: Record<string, string> = { accept: "application/json" };
    const init: RequestInit = { method, headers };
    if (body !== undefined) {
      init.body = JSON.stringify(body);
      headers["content-type"] = "application/json";
    }
    const response = await transport(path, init);
    if (!response.ok) throw await ApiError.from(response);
    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  }
  return {
    get: <T>(path: string, query?: Query) => request<T>("GET", withQuery(path, query)),
    post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
    patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, body),
    put: <T>(path: string, body?: unknown) => request<T>("PUT", path, body),
    delete: <T>(path: string) => request<T>("DELETE", path),
  };
}

export type Http = ReturnType<typeof createHttp>;
