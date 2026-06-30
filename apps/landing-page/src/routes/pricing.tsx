import { createFileRoute } from "@tanstack/react-router";
import { PageHeading, Section } from "../components/ui";
import { createSeoHeadFromRegistry, resolveSiteUrl } from "../lib/seo";
import { Navbar } from "./(home)/helpers/navbar";
import { Footer } from "./(home)/sections/footer";

const siteUrl = resolveSiteUrl(import.meta.env.VITE_WEB_URL);

export const Route = createFileRoute("/pricing")({
  head: () =>
    createSeoHeadFromRegistry("landing:pricing", { siteUrl }),
  component: () => (
    <div className="flex min-h-screen flex-col overflow-hidden bg-background">
      <Navbar />
      <main className="flex-1">
        <Section>
          <PageHeading
            description="Transparent, simple pricing. Choose the plan that works for you."
            title="Pricing"
          />
        </Section>
      </main>
      <Footer />
    </div>
  ),
});
