import { createFileRoute } from "@tanstack/react-router";
import { LandingPage } from "./(home)/page";
import { createSeoHeadFromRegistry, resolveSiteUrl } from "../lib/seo";

const siteUrl = resolveSiteUrl(import.meta.env.VITE_WEB_URL);

export const Route = createFileRoute("/")({
  head: () =>
    createSeoHeadFromRegistry("landing:home", { siteUrl }),
  component: LandingPage,
});
