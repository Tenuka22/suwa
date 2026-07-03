import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/dashboard")({
  component: DashboardRoute,
});

function DashboardRoute() {
  return (
    <main className="container mx-auto max-w-3xl px-4 py-8">
      <h1 className="font-semibold text-2xl">Dashboard</h1>
      <p className="mt-2 text-muted-foreground">You are signed in.</p>
    </main>
  );
}
