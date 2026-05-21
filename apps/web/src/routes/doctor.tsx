import { useUser } from "@clerk/tanstack-react-start";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@zen-doc/ui/components/sidebar";

import { DoctorSidebar } from "@/components/doctor-sidebar";

export const Route = createFileRoute("/doctor")({
  component: DoctorLayoutRoute,
});

function DoctorLayoutRoute() {
  const user = useUser();
  const name = user.user?.fullName ?? user.user?.username ?? "Doctor";

  return (
    <SidebarProvider>
      <DoctorSidebar />
      <SidebarInset>
        <div className="flex min-h-svh flex-col">
          <header className="flex items-center gap-3 border-b px-6 py-4">
            <SidebarTrigger />
            <div className="min-w-0">
              <p className="font-medium">Doctor Portal</p>
              <p className="truncate text-muted-foreground text-sm">
                Signed in as {name}
              </p>
            </div>
          </header>
          <div className="flex-1">
            <Outlet />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
