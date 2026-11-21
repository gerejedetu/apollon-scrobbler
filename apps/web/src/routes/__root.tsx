/// <reference types="vite-plus/client" />
import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { type ReactNode, useEffect } from "react";
import { loadViewer } from "../auth/index.ts";
import { RootError, RootNotFound } from "../features/errors/index.ts";
import { initialTheme, THEME_SCRIPT } from "../lib/theme.ts";
import { getLocale } from "../paraglide/runtime.js";
import { rememberOffset } from "../lib/timezone.ts";
import appCss from "../styles.css?url";
import { ToastProvider } from "../ui/feedback/index.ts";
import { fontsHref } from "../ui/theme/index.ts";

export const Route = createRootRoute({
  beforeLoad: async () => ({ viewer: await loadViewer() }),
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Needle" },
      { name: "description", content: "Ton carnet d'écoute, tenu tout seul." },
    ],
    links: [
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
  useEffect(rememberOffset, []);
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
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
