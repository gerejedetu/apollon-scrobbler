/// <reference types="vite-plus/client" />
import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { loadViewer } from "../auth/index.ts";
import { RootError, RootNotFound } from "../features/errors/index.ts";
import { initialTheme, THEME_SCRIPT } from "../lib/theme.ts";
import { getLocale } from "../paraglide/runtime.js";
import { OFFSET_SCRIPT } from "../lib/timezone.ts";
import appCss from "../styles.css?url";
import { ToastProvider } from "../ui/feedback/index.ts";
import { APP_NAME } from "../ui/brand/index.ts";
import { fontsHref } from "../ui/theme/index.ts";
import { m } from "../paraglide/messages.js";

export const Route = createRootRoute({
  beforeLoad: async () => ({ viewer: await loadViewer() }),
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: APP_NAME },
      { name: "theme-color", content: "#FFFFFF", media: "(prefers-color-scheme: light)" },
      { name: "theme-color", content: "#101010", media: "(prefers-color-scheme: dark)" },
      { name: "description", content: m.meta_description() },
    ],
    links: [
      { rel: "icon", href: "/favicon.ico", sizes: "48x48" },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "manifest", href: "/site.webmanifest" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: fontsHref },
      { rel: "stylesheet", href: appCss },
    ],
  }),
  component: RootComponent,
  errorComponent: (props) => (
    <RootDocument>
      <RootError {...props} />
    </RootDocument>
  ),
  notFoundComponent: RootNotFound,
});

function RootComponent() {
  return (
    <RootDocument>
      <ToastProvider>
        <Outlet />
      </ToastProvider>
    </RootDocument>
  );
}

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html
      lang={getLocale()}
      className={initialTheme() === "dark" ? "dark" : undefined}
      suppressHydrationWarning
    >
      <head>
        {/* oxlint-disable-next-line react/no-danger -- static script, no user data */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        {/* oxlint-disable-next-line react/no-danger -- static script, no user data */}
        <script dangerouslySetInnerHTML={{ __html: OFFSET_SCRIPT }} />
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
