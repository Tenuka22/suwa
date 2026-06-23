import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "./(home)/helpers/navbar";
import { Footer } from "./(home)/sections/footer";
import { PageHeading, Section } from "../components/ui";

export const Route = createFileRoute("/pricing")({
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
