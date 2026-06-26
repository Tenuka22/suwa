import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/doctor/hub/$materialId")({
  beforeLoad: () => {
    throw redirect({ to: "/doctor/sessions" });
  },
  component: () => null,
});
