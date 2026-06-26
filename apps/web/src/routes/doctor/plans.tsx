import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/doctor/plans")({
  beforeLoad: () => {
    throw redirect({ to: "/doctor/sessions" });
  },
  component: () => null,
});
