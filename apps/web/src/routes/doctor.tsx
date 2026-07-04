import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/doctor")({
  ssr: false,
  beforeLoad: async () => {
    const { data: session } = await authClient.getSession();
    if (!session) {
      throw redirect({ to: "/login" });
    }
    if (session.user?.role === "user") {
      throw redirect({ to: "/onboarding" });
    }
    if (session.user?.role !== "doctor" && session.user?.role !== "pending-doctor") {
      throw redirect({ to: "/" });
    }
  },
  component: DoctorLayout,
});

function DoctorLayout() {
  return <Outlet />;
}
