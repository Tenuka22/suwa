import { useClerk, useUser } from "@clerk/tanstack-react-start";
import {
  createFileRoute,
  Link,
  Outlet,
  redirect,
  useMatches,
} from "@tanstack/react-router";
import { Avatar, AvatarFallback } from "@zen-doc/ui/components/avatar";
import { Badge } from "@zen-doc/ui/components/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@zen-doc/ui/components/breadcrumb";
import { Button } from "@zen-doc/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@zen-doc/ui/components/dropdown-menu";
import { Separator } from "@zen-doc/ui/components/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@zen-doc/ui/components/sidebar";
import {
  HelpCircleIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  SettingsIcon,
  UserIcon,
} from "lucide-react";

import { DoctorSidebar } from "@/components/doctor-sidebar";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/doctor")({
  beforeLoad: async ({ context, location }) => {
    if (location.pathname === "/doctor/profile") {
      return;
    }

    const data = await context.queryClient.fetchQuery({
      queryKey: orpc.doctorProfile.queryKey(),
      queryFn: () => orpc.doctorProfile.call(),
    });

    if (!data?.profile) {
      throw redirect({ to: "/doctor/profile" });
    }
  },
  component: DoctorLayoutRoute,
});

function Breadcrumbs() {
  const matches = useMatches();
  const breadcrumbs = matches
    .filter((match) => match.routeId !== "__root__")
    .flatMap((match) => {
      const pathname = match.pathname;
      const segments = pathname.split("/").filter(Boolean);
      return segments.map((segment, index) => {
        const href = `/${segments.slice(0, index + 1).join("/")}`;
        const isLast = index === segments.length - 1;
        const label = segment.charAt(0).toUpperCase() + segment.slice(1);

        return { href, label, isLast };
      });
    })
    .filter(
      (crumb, index, self) =>
        index === self.findIndex((c) => c.href === crumb.href)
    );

  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbs.map((crumb) => (
          <BreadcrumbItem key={crumb.href}>
            {crumb.isLast ? (
              <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
            ) : (
              <BreadcrumbLink render={<Link to={crumb.href} />}>
                {crumb.label}
              </BreadcrumbLink>
            )}
            {!crumb.isLast && <BreadcrumbSeparator />}
          </BreadcrumbItem>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

function DoctorLayoutRoute() {
  const user = useUser();
  const { signOut } = useClerk();
  const name = user.user?.fullName ?? user.user?.username ?? "Doctor";
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <SidebarProvider>
      <DoctorSidebar />
      <SidebarInset>
        <div className="flex min-h-svh flex-col">
          <header className="sticky top-0 z-10 flex items-center gap-3 border-b bg-background/80 px-4 py-2 backdrop-blur-md supports-backdrop-filter:bg-background/60">
            <SidebarTrigger />
            <Separator className="h-6" orientation="vertical" />
            <Breadcrumbs />
            <div className="ml-auto flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button className="gap-2 pr-2 pl-1.5" variant="ghost">
                      <Avatar className="size-6">
                        <AvatarFallback className="text-[10px]">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden font-medium sm:inline">
                        {name}
                      </span>
                    </Button>
                  }
                />
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex items-center gap-3 px-2 py-1.5">
                    <Avatar>
                      <AvatarFallback className="text-xs">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate font-medium text-sm">
                        {name}
                      </span>
                      <Badge className="w-fit" variant="secondary">
                        Doctor
                      </Badge>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <LayoutDashboardIcon />
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <UserIcon />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <SettingsIcon />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <HelpCircleIcon />
                    Help
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => signOut()}
                    variant="destructive"
                  >
                    <LogOutIcon />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
