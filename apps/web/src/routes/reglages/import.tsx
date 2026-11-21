import { createFileRoute } from "@tanstack/react-router";
import { ImportPage } from "../../features/import/index.ts";
import { m } from "../../paraglide/messages.js";

export const Route = createFileRoute("/reglages/import")({
  head: () => ({ meta: [{ title: `${m.settings_import()} · Needle` }] }),
  component: ImportPage,
});
