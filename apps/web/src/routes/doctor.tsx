import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

import { DoctorShell } from "@/components/doctor/doctor-shell";
import { authClient } from "@/lib/auth-client";
import { getUserRole } from "@/lib/user-role";

export const Route = createFileRoute("/doctor")({
  ssr: false,
  beforeLoad: async () => {
    const { data: session } = await authClient.getSession();
    if (!session) {
      throw redirect({ to: "/login" });
    }
    const role = getUserRole(session.user);
    if (role === "user") {
      throw redirect({ to: "/onboarding" });
    }
    if (role !== "doctor" && role !== "pending-doctor") {
      throw redirect({ to: "/" });
    }
  },
  component: DoctorLayout,
});

function DoctorLayout() {
  return (
    <DoctorShell>
      <Outlet />
    </DoctorShell>
  );
}
