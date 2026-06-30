import { createFileRoute } from "@tanstack/react-router";
import { PageHeading, Section } from "../components/ui";
import { createSeoHeadFromRegistry, resolveSiteUrl } from "../lib/seo";
import { Navbar } from "./(home)/helpers/navbar";
import { Footer } from "./(home)/sections/footer";

const siteUrl = resolveSiteUrl(import.meta.env.VITE_WEB_URL);

export const Route = createFileRoute("/contact")({
  head: () =>
    createSeoHeadFromRegistry("landing:contact", { siteUrl }),
  component: () => (
    <div className="flex min-h-screen flex-col overflow-hidden bg-background">
      <Navbar />
      <main className="flex-1">
        <Section>
          <PageHeading
            description="Have questions? We're here to help. Reach out to us through any of the channels below."
            title="Contact Us"
          />
        </Section>
      </main>
      <Footer />
    </div>
  ),
});
