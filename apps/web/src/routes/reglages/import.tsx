import { createFileRoute } from "@tanstack/react-router";
import { ImportPage } from "../../features/import/index.ts";

export const Route = createFileRoute("/reglages/import")({
  head: () => ({ meta: [{ title: "Importer · Needle" }] }),
  component: ImportPage,
});
