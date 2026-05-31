import { useClerk, useUser } from "@clerk/tanstack-react-start";
import {
  createFileRoute,
  Link,
  Outlet,
  redirect,
  useMatches,
} from "@tanstack/react-router";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@zen-doc/ui/components/breadcrumb";
import { Separator } from "@zen-doc/ui/components/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@zen-doc/ui/components/sidebar";

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
          </header>
          <div className="flex-1 p-6">
            <Outlet />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
