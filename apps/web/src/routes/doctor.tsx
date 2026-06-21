import { SignInButton as ClerkSignInButton } from "@clerk/tanstack-react-start";
import { Button, Card, Separator } from "@heroui/react";
import {
  createFileRoute,
  Link,
  Outlet,
  redirect,
  useLoaderData,
  useMatches,
} from "@tanstack/react-router";
import { MenuIcon, StethoscopeIcon } from "lucide-react";
import { useState } from "react";

import { DoctorSidebar } from "@/components/doctor-sidebar";
import { getServerSession } from "@/utils/clerk-auth";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/doctor")({
  beforeLoad: async ({ context, location }) => {
    const session = await getServerSession();

    if (!session) {
      return { session: null };
    }

    if (location.pathname === "/doctor/profile") {
      return { session };
    }

    const data = await context.queryClient.ensureQueryData(
      orpc.doctorProfile.queryOptions()
    );

    if (!data?.profile) {
      throw redirect({ to: "/doctor/profile" });
    }

    if (!data?.profile?.hasFaceEmbedding) {
      throw redirect({ to: "/doctor/profile" });
    }

    return { session };
  },
  loader: ({ context }) => ({ session: context.session }),
  component: DoctorLayoutRoute,
});

function DoctorBreadcrumbs() {
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
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-2 text-muted-foreground text-sm"
    >
      {breadcrumbs.map((crumb) => (
        <span className="flex items-center gap-2" key={crumb.href}>
          {crumb.isLast ? (
            <span className="font-medium text-foreground">{crumb.label}</span>
          ) : (
            <Link
              className="transition-colors hover:text-foreground"
              to={crumb.href}
            >
              {crumb.label}
            </Link>
          )}
          {!crumb.isLast && <span>/</span>}
        </span>
      ))}
    </nav>
  );
}

function DoctorLayoutRoute() {
  const { session } = useLoaderData({ from: "/doctor" });
  const [sidebarOpen, setSidebarOpen] = useState(true);

  if (!session) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Card className="w-full max-w-md rounded-3xl">
          <Card.Header className="items-center text-center">
            <div className="rounded-2xl border bg-muted/40 p-4">
              <StethoscopeIcon className="size-6" />
            </div>
            <div className="flex flex-col gap-2">
              <Card.Title>Unauthorized</Card.Title>
              <Card.Description>
                You are not authorized to access this page.
              </Card.Description>
            </div>
          </Card.Header>
          <Card.Content className="flex justify-center">
            <ClerkSignInButton />
          </Card.Content>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-svh">
      <DoctorSidebar collapsed={!sidebarOpen} />
      <main className="flex w-full flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-12 items-center gap-3 border-b bg-background/80 px-3 backdrop-blur-md supports-backdrop-filter:bg-background/60">
          <Button
            isIconOnly
            onPress={() => setSidebarOpen((v) => !v)}
            variant="ghost"
          >
            <MenuIcon />
          </Button>
          <Separator className="h-12" orientation="vertical" />
          <DoctorBreadcrumbs />
        </header>
        <div className="flex-1 p-4">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
