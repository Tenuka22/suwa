import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@suwa/ui/components/breadcrumb";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@suwa/ui/components/card";
import { Separator } from "@suwa/ui/components/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@suwa/ui/components/sidebar";
import {
  createFileRoute,
  Link,
  Outlet,
  redirect,
  useLoaderData,
  useMatches,
} from "@tanstack/react-router";
import { StethoscopeIcon } from "lucide-react";
import { Button } from "@suwa/ui/components/button";

import { DoctorSidebar } from "@/components/doctor-sidebar";
import { requireAuth } from "@/utils/auth";
import { buildHeadFromKey } from "./__root";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/doctor")({
  head: () => buildHeadFromKey("web:doctor:index"),
  beforeLoad: async ({ context, location }) => {
    const session = await requireAuth(["doctor", "pending-doctor"]).catch(() => null);
    if (!session) return { session: null };

    if (location.pathname === "/doctor/profile") {
      return { session };
    }

    const data = await context.queryClient.ensureQueryData(
      orpc.doctorProfile.queryOptions()
    );

    if (!data?.profile || !data.profile.permanent || !data.profile.hasFaceEmbedding) {
      throw redirect({ to: "/doctor/profile" });
    }

    return { session };
  },
  loader: ({ context }) => ({ session: context.session }),
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
  const { session } = useLoaderData({ from: "/doctor" });

  if (!session) {
    return (
      <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-background px-4 text-foreground">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,color-mix(in_oklch,var(--secondary)_28%,transparent),transparent_28%),radial-gradient(circle_at_88%_16%,color-mix(in_oklch,var(--muted-foreground)_22%,transparent),transparent_30%),linear-gradient(180deg,var(--background)_0%,var(--muted)_56%,var(--background)_100%)]"
        />
        <Card className="relative w-full max-w-md rounded-[2rem] border-border/95 bg-card/82 p-2 text-center shadow-[0_24px_70px_color-mix(in_oklch,var(--foreground)_12%,transparent)] backdrop-blur-md">
          <CardHeader className="flex items-center justify-center gap-4 text-center">
            <div className="rounded-full border border-border bg-background p-4 text-muted-foreground">
              <StethoscopeIcon className="size-8" />
            </div>
            <div className="flex flex-col gap-2 items-center justify-center">
              <CardTitle className="text-2xl tracking-tight">
                Unauthorized
              </CardTitle>
              <CardDescription className="text-muted-foreground leading-7">
                You need a doctor account to access this page.
              </CardDescription>
            </div>
            <Button
              className="h-12 rounded-full border-border bg-card px-5 text-foreground hover:bg-muted"
              render={<Link to="/sign-in">Sign in</Link>}
              variant="outline"
            />
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <SidebarProvider className="bg-background">
      <DoctorSidebar />
      <SidebarInset className="relative overflow-hidden bg-background text-foreground">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,color-mix(in_oklch,var(--secondary)_22%,transparent),transparent_28%),radial-gradient(circle_at_88%_16%,color-mix(in_oklch,var(--muted-foreground)_16%,transparent),transparent_30%),linear-gradient(180deg,var(--background)_0%,var(--muted)_56%,var(--background)_100%)]"
        />
        <div className="relative flex min-h-svh flex-col px-4 py-4 sm:px-6 lg:px-8">
          <header className="sticky top-4 z-10 flex min-h-14 items-center gap-3 rounded-[1.4rem] border border-border/90 bg-card/80 px-3 shadow-[0_14px_40px_color-mix(in_oklch,var(--foreground)_8%,transparent)] backdrop-blur-md">
            <SidebarTrigger className="rounded-full hover:bg-muted" />
            <Separator className="h-8 bg-border" orientation="vertical" />
            <div className="min-w-0 flex-1">
              <Breadcrumbs />
            </div>
          </header>
          <main className="flex-1 py-6">
            <Outlet />
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
