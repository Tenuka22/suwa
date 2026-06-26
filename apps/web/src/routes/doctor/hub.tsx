import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/doctor/hub")({
  beforeLoad: () => {
    throw redirect({ to: "/doctor/sessions" });
  },
  component: () => null,
});
