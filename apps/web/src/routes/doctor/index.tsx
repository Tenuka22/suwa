import { createFileRoute, redirect } from "@tanstack/react-router";

import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/doctor/")({
  beforeLoad: async () => {
    const { data: session } = await authClient.getSession();
    if (session?.user?.role === "pending-doctor") {
      throw redirect({ to: "/doctor/verification" });
    }
  },
  component: DoctorHub,
});

function DoctorHub() {
  return (
    <div className="flex size-full flex-col items-center justify-center gap-4">
      <h1 className="font-bold text-2xl">Doctor Hub</h1>
      <p className="text-muted-foreground">Welcome to your doctor dashboard.</p>
    </div>
  );
}
