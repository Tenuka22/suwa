import { useUser } from "@clerk/tanstack-react-start";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@zen-doc/ui/components/sidebar";

import { AdminSidebar } from "@/components/admin-sidebar";

export const Route = createFileRoute("/admin")({
  component: AdminLayoutRoute,
});

function AdminLayoutRoute() {
  const user = useUser();
  const name = user.user?.fullName ?? user.user?.username ?? "Admin";

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        <div className="flex min-h-svh flex-col">
          <header className="flex items-center gap-3 border-b px-6 py-4">
            <SidebarTrigger />
            <div className="min-w-0">
              <p className="font-medium">Admin Console</p>
              <p className="truncate text-muted-foreground text-sm">
                Signed in as {name}
              </p>
            </div>
          </header>
          <div className="flex-1 p-6">
            <Outlet />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
