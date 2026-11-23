import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { loadInstance } from "../auth/instance.ts";
import { Shell } from "../features/shell/index.ts";
import { FeatureList, LandingHero, Page, SectionHeader } from "../ui/apollon/index.ts";
import { m } from "../paraglide/messages.js";

/** Signed in: your own profile. Signed out: the instance's home (design system: PageLanding). */
export const Route = createFileRoute("/")({
  beforeLoad: ({ context }) => {
    if (context.viewer)
      throw redirect({ to: "/u/$userName", params: { userName: context.viewer.userName } });
  },
  loader: () => loadInstance(),
  component: Landing,
});

function Landing() {
  const { signupOpen } = Route.useLoaderData();
  return (
    <Shell viewer={null} signupOpen={signupOpen}>
      <LandingHero
        title={m.ds_auth_quote()}
        lead={m.ds_landing_lead()}
        actions={[
          <Link key="in" to="/connexion" className="ap-btn ap-btn--primary">
            {m.signin_submit()}
          </Link>,
          signupOpen ? (
            <Link key="up" to="/inscription" className="ap-btn ap-btn--light">
              {m.signin_create()}
            </Link>
          ) : null,
        ]}
      />
      <Page>
        <section>
          <SectionHeader title={m.ds_landing_features()} showPeriod={false} />
          <FeatureList
            items={[
              { icon: "history", title: m.ds_feature_players(), text: m.ds_feature_players_text() },
              {
                icon: "calendar",
                title: m.ds_feature_reports(),
                text: m.ds_feature_reports_text(),
              },
              { icon: "external", title: m.ds_feature_data(), text: m.ds_feature_data_text() },
            ]}
          />
        </section>
      </Page>
    </Shell>
  );
}
