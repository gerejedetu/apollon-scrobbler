import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vite-plus/test";

afterEach(() => cleanup());

// Without the TanStack Start plugin, isomorphic functions run their server branch, which needs a request.
// Tests are a browser: use the browser's offset.
vi.mock("../src/lib/timezone.ts", async (load) => {
  const real = await load<typeof import("../src/lib/timezone.ts")>();
  return { ...real, utcOffset: real.browserOffset };
});

// Tests read the French texts (the base locale), whatever the test browser prefers.
vi.mock("../src/paraglide/runtime.js", async (load) => {
  const real = await load<typeof import("../src/paraglide/runtime.js")>();
  return { ...real, getLocale: () => "fr" as const };
});
