import { SignInButton as ClerkSignInButton } from "@clerk/tanstack-react-start";
import { Breadcrumbs, Card, Separator } from "@heroui/react";
import { createFileRoute, Outlet, useMatches } from "@tanstack/react-router";
import { BuildingIcon } from "lucide-react";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/sidebar-context";

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
    <Breadcrumbs>
      {breadcrumbs.map((crumb) => (
        <Breadcrumbs.Item
          href={crumb.isLast ? undefined : crumb.href}
          key={crumb.href}
        >
          {crumb.label}
        </Breadcrumbs.Item>
      ))}
    </Breadcrumbs>
  );
}

function TenantLayoutRoute() {
  const { session } = Route.useLoaderData();

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
    <SidebarProvider>
      <TenantSidebar />
      <SidebarInset>
        <div className="flex min-h-svh flex-col">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b bg-background/80 pl-3 backdrop-blur-md supports-backdrop-filter:bg-background/60">
            <SidebarTrigger />
            <Separator className="h-14" orientation="vertical" />
            <TenantBreadcrumbs />
          </header>
          <div className="flex-1 p-4">
            <Outlet />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
