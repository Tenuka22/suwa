import {
  SignInButton as ClerkSignInButton,
  useUser,
} from "@clerk/tanstack-react-start";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@zen-doc/ui/components/card";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@zen-doc/ui/components/sidebar";
import { ShieldIcon } from "lucide-react";

import { AdminSidebar } from "@/components/admin-sidebar";
import { useRole } from "@/hooks/use-role";

export const Route = createFileRoute("/admin")({
  component: AdminLayoutRoute,
});

function AdminLayoutRoute() {
  const user = useUser();
  const role = useRole();
  const name = user.user?.fullName ?? user.user?.username ?? "Admin";

  if (!user.isLoaded) {
    return null;
  }

  if (!user.user) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Card className="w-full max-w-md rounded-3xl">
          <CardHeader className="items-center text-center">
            <div className="rounded-2xl border bg-muted/40 p-4">
              <ShieldIcon className="size-6" />
            </div>
            <div className="space-y-2">
              <CardTitle>Sign in required</CardTitle>
              <CardDescription>
                Access the admin panel after signing in.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex justify-center">
            <ClerkSignInButton />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (role !== "admin") {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Card className="w-full max-w-md rounded-3xl">
          <CardHeader className="items-center text-center">
            <div className="rounded-2xl border bg-muted/40 p-4">
              <ShieldIcon className="size-6" />
            </div>
            <div className="space-y-2">
              <CardTitle>Unauthorized</CardTitle>
              <CardDescription>You do not have admin access.</CardDescription>
            </div>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        <div className="flex min-h-svh flex-col">
          <header className="sticky top-0 z-10 flex items-center gap-3 border-b bg-background/80 px-6 py-4 backdrop-blur-md supports-backdrop-filter:bg-background/60">
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
