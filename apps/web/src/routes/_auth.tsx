import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/_auth")({
  ssr: false,
  beforeLoad: async () => {
    const { data: session } = await authClient.getSession();
    if (!session) {
      throw redirect({ to: "/login" });
    }
    if (session.user?.role === "user") {
      throw redirect({ to: "/onboarding" });
    }
  },
  component: AuthLayout,
});

function AuthLayout() {
  return <Outlet />;
}
