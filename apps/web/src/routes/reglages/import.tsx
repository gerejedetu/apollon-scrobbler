import { createFileRoute } from "@tanstack/react-router";
import { ImportPage } from "../../features/import/index.ts";
import { Page } from "../../ui/apollon/index.ts";
import { m } from "../../paraglide/messages.js";
import { pageTitle } from "../../ui/brand/index.ts";

export const Route = createFileRoute("/reglages/import")({
  head: () => ({ meta: [{ title: pageTitle(m.settings_import()) }] }),
  component: () => (
    <Page>
      <div className="ap-settings ap-stack">
        <ImportPage />
      </div>
    </Page>
  ),
});
