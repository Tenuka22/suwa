import { SignInButton as ClerkSignInButton } from "@clerk/tanstack-react-start";
import { Button, Card, Separator } from "@heroui/react";
import {
  createFileRoute,
  Link,
  Outlet,
  useLoaderData,
  useMatches,
} from "@tanstack/react-router";
import { BuildingIcon, MenuIcon } from "lucide-react";
import { useState } from "react";

import { TenantSidebar } from "@/components/tenant-sidebar";
import { getServerSession } from "@/utils/clerk-auth";

export const Route = createFileRoute("/tenant")({
  beforeLoad: async () => {
    const session = await getServerSession();
    return { session };
  },
  loader: ({ context }) => ({ session: context.session }),
  component: TenantLayoutRoute,
});

function TenantBreadcrumbs() {
  const matches = useMatches();

  const breadcrumbs = matches
    .filter((match) => match.routeId !== "__root__")
    .flatMap((match) => {
      const segments = match.pathname.split("/").filter(Boolean);

      return segments.map((segment, index) => {
        const href = `/${segments.slice(0, index + 1).join("/")}`;
        const isLast = index === segments.length - 1;

        return {
          href,
          label: segment.charAt(0).toUpperCase() + segment.slice(1),
          isLast,
        };
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

function TenantLayoutRoute() {
  const { session } = useLoaderData({ from: "/tenant" });
  const [sidebarOpen, setSidebarOpen] = useState(true);

  if (!session) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Card className="w-full max-w-md rounded-3xl">
          <Card.Header className="items-center text-center">
            <div className="rounded-2xl border bg-muted/40 p-4">
              <BuildingIcon className="size-6" />
            </div>
            <div className="flex flex-col gap-2">
              <Card.Title>Unauthorized</Card.Title>
              <Card.Description>
                You do not have tenant admin access or are not signed in.
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
      <TenantSidebar collapsed={!sidebarOpen} />

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

          <TenantBreadcrumbs />
        </header>

        <div className="flex-1 p-4">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
