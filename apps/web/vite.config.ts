import { cloudflare } from "@cloudflare/vite-plugin";
import { paraglideVitePlugin } from "@inlang/paraglide-js";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig, type PluginOption } from "vite-plus";

// Tests render components in happy-dom: no Worker runtime, no router codegen.
const testing = process.env.VITEST === "true";

/**
 * Framework plugins are typed against upstream Vite while this config is Vite+'s: same plugin API,
 * two copies of the types. One explicit widening here keeps the rest of the config checked.
 */
const plugin = (p: unknown) => p as PluginOption;

const plugins: PluginOption[] = testing
  ? [plugin(viteReact())]
  : [
      // Compiles messages/*.json into typed message functions (src/paraglide, git-ignored).
      plugin(
        paraglideVitePlugin({
          project: "./project.inlang",
          outdir: "./src/paraglide",
          strategy: ["cookie", "preferredLanguage", "baseLocale"],
        }),
      ),
      plugin(cloudflare({ viteEnvironment: { name: "ssr" } })),
      plugin(tanstackStart({ srcDirectory: "src", router: { routesDirectory: "routes" } })),
      plugin(viteReact()),
    ];

export default defineConfig({
  server: { port: 3000 },
  plugins,
  resolve: { alias: { "styled-system": new URL("./styled-system", import.meta.url).pathname } },
  test: {
    environment: "happy-dom",
    include: ["src/**/*.test.{ts,tsx}", "tests/**/*.test.{ts,tsx}"],
    setupFiles: ["./tests/setup.ts"],
  },
});
